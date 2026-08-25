import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  refreshExpiryDate,
} from "../utils/tokens.js";
import {
  validateUsername,
  validatePassword,
  LOGIN_LOCKOUT,
} from "../utils/passwordPolicy.js";

const BCRYPT_ROUNDS = 12;

function publicUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    role: user.role,
    phone: user.phone,
    mustChangePassword: user.mustChangePassword,
  };
}

function setRefreshCookie(res, rawToken) {
  res.cookie("refreshToken", rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 7) * 24 * 60 * 60 * 1000,
  });
}

export async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Введите логин и пароль" });
    }

    const user = await prisma.user.findUnique({ where: { username } });

    // Не раскрываем, что именно неверно (логин или пароль) — общая ошибка
    const invalidMsg = "Неверный логин или пароль";

    if (!user || !user.isActive) {
      return res.status(401).json({ error: invalidMsg });
    }

    // Проверка блокировки аккаунта
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil - new Date()) / 60000);
      return res.status(423).json({
        error: `Аккаунт временно заблокирован из-за неудачных попыток входа. Повторите через ${minutesLeft} мин.`,
      });
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);

    if (!passwordOk) {
      const attempts = user.failedLoginAttempts + 1;
      const shouldLock = attempts >= LOGIN_LOCKOUT.MAX_ATTEMPTS;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: shouldLock ? 0 : attempts,
          lockedUntil: shouldLock
            ? new Date(Date.now() + LOGIN_LOCKOUT.LOCK_MINUTES * 60 * 1000)
            : null,
        },
      });
      if (shouldLock) {
        return res.status(423).json({
          error: `Аккаунт заблокирован на ${LOGIN_LOCKOUT.LOCK_MINUTES} минут из-за превышения числа попыток входа`,
        });
      }
      return res.status(401).json({ error: invalidMsg });
    }

    // Успешный вход — сброс счётчика попыток
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    const accessToken = signAccessToken(user);
    const { raw, hash } = generateRefreshToken();
    await prisma.refreshToken.create({
      data: { tokenHash: hash, userId: user.id, expiresAt: refreshExpiryDate() },
    });

    setRefreshCookie(res, raw);
    res.json({ accessToken, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const raw = req.cookies?.refreshToken;
    if (!raw) return res.status(401).json({ error: "Нет refresh-токена" });

    const hash = hashRefreshToken(raw);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hash } });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: "Сессия истекла, войдите снова" });
    }

    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Пользователь недоступен" });
    }

    // Ротация refresh-токена
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
    const { raw: newRaw, hash: newHash } = generateRefreshToken();
    await prisma.refreshToken.create({
      data: { tokenHash: newHash, userId: user.id, expiresAt: refreshExpiryDate() },
    });
    setRefreshCookie(res, newRaw);

    const accessToken = signAccessToken(user);
    res.json({ accessToken, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const raw = req.cookies?.refreshToken;
    if (raw) {
      const hash = hashRefreshToken(raw);
      await prisma.refreshToken.updateMany({ where: { tokenHash: hash }, data: { revoked: true } });
    }
    res.clearCookie("refreshToken", { path: "/api/auth" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const ok = await bcrypt.compare(currentPassword || "", user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Текущий пароль указан неверно" });

    const errors = validatePassword(newPassword, user.username);
    if (errors.length) return res.status(400).json({ error: "Пароль не соответствует требованиям", details: errors });

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, mustChangePassword: false },
    });

    // Отзываем все активные сессии после смены пароля
    await prisma.refreshToken.updateMany({ where: { userId: user.id }, data: { revoked: true } });

    res.json({ ok: true, message: "Пароль успешно изменён. Войдите заново." });
  } catch (err) {
    next(err);
  }
}

// Создание нового пользователя (менеджера или админа) — только для админа
export async function createUser(req, res, next) {
  try {
    const { fullName, username, password, role, phone } = req.body;

    const usernameErrors = validateUsername(username);
    const passwordErrors = validatePassword(password, username);
    const allErrors = [...usernameErrors, ...passwordErrors];
    if (!fullName || fullName.trim().length < 2) {
      allErrors.push("Укажите полное имя сотрудника");
    }
    if (role && !["ADMIN", "MANAGER"].includes(role)) {
      allErrors.push("Недопустимая роль");
    }
    if (allErrors.length) {
      return res.status(400).json({ error: "Ошибка валидации", details: allErrors });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return res.status(409).json({ error: "Пользователь с таким логином уже существует" });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        fullName,
        username,
        passwordHash,
        role: role || "MANAGER",
        phone: phone || null,
      },
    });

    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}
