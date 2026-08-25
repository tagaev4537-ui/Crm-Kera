import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../config/prisma.js";
import { validatePassword } from "../utils/passwordPolicy.js";

const BCRYPT_ROUNDS = 12;

function publicUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    role: user.role,
    phone: user.phone,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

export async function listUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
    res.json({ users: users.map(publicUser) });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { fullName, phone, role, isActive } = req.body;

    if (id === req.user.id && isActive === false) {
      return res.status(400).json({ error: "Нельзя деактивировать собственный аккаунт" });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(phone !== undefined && { phone }),
        ...(role !== undefined && { role }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

// Админ сбрасывает пароль сотруднику — генерируется временный пароль,
// сотрудник обязан сменить его при следующем входе
export async function resetUserPassword(req, res, next) {
  try {
    const { id } = req.params;
    const tempPassword = generateCompliantTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

    await prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: true, failedLoginAttempts: 0, lockedUntil: null },
    });
    await prisma.refreshToken.updateMany({ where: { userId: id }, data: { revoked: true } });

    res.json({ ok: true, temporaryPassword: tempPassword });
  } catch (err) {
    next(err);
  }
}

function generateCompliantTempPassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%^&*";
  const pick = (set) => set[crypto.randomInt(0, set.length)];

  let pwd = pick(upper) + pick(lower) + pick(digits) + pick(special);
  const all = upper + lower + digits + special;
  while (pwd.length < 12) pwd += pick(all);

  // Перемешиваем символы
  pwd = pwd
    .split("")
    .sort(() => crypto.randomInt(-1, 2))
    .join("");

  const errors = validatePassword(pwd);
  if (errors.length) return generateCompliantTempPassword();
  return pwd;
}
