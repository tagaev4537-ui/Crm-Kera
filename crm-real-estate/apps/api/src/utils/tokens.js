import jwt from "jsonwebtoken";
import crypto from "crypto";

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, username: user.username },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m" }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

// Refresh-токен: случайная строка, которую мы храним в БД в виде хэша (SHA-256)
export function generateRefreshToken() {
  const raw = crypto.randomBytes(48).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export function hashRefreshToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function refreshExpiryDate() {
  const days = Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 7);
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
