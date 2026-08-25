import { verifyAccessToken } from "../utils/tokens.js";
import { prisma } from "../config/prisma.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Требуется авторизация" });
    }

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Пользователь не найден или деактивирован" });
    }

    req.user = {
      id: user.id,
      role: user.role,
      username: user.username,
      fullName: user.fullName,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Недействительный или истёкший токен" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Недостаточно прав для этого действия" });
    }
    next();
  };
}
