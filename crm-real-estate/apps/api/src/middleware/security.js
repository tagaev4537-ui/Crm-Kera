import rateLimit from "express-rate-limit";

// Жёсткий лимит на попытки входа — защита от подбора пароля
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 20, // максимум 20 попыток входа с одного IP за окно
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Слишком много попыток входа. Попробуйте позже." },
});

// Общий лимит на все запросы к API
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Слишком много запросов. Попробуйте позже." },
});

export function notFoundHandler(req, res) {
  res.status(404).json({ error: "Маршрут не найден" });
}

export function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.code === "P2025") {
    return res.status(404).json({ error: "Запись не найдена" });
  }
  if (err.code === "P2002") {
    return res.status(409).json({ error: "Такая запись уже существует (нарушение уникальности)" });
  }
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Внутренняя ошибка сервера" });
}
