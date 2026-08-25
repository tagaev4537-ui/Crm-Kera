/**
 * Стандарты логина и пароля для CRM.
 *
 * Логин (username):
 *  - от 4 до 32 символов
 *  - только латинские буквы, цифры, точка, подчёркивание, дефис
 *  - без пробелов
 *
 * Пароль:
 *  - минимум 10 символов
 *  - минимум 1 заглавная буква (A-Z)
 *  - минимум 1 строчная буква (a-z)
 *  - минимум 1 цифра (0-9)
 *  - минимум 1 спецсимвол (!@#$%^&*()_+-=[]{};':"\\|,.<>/?)
 *  - не должен совпадать с логином
 *  - не должен быть в списке самых частых слабых паролей
 */

const USERNAME_REGEX = /^[a-zA-Z0-9._-]{4,32}$/;

const COMMON_WEAK_PASSWORDS = new Set([
  "password", "password1", "12345678", "123456789", "qwerty123",
  "admin123", "admin1234", "letmein1", "welcome1", "111111111",
  "P@ssw0rd", "Passw0rd!", "qwertyuiop",
]);

export function validateUsername(username) {
  const errors = [];
  if (!username || typeof username !== "string") {
    errors.push("Логин обязателен");
    return errors;
  }
  if (!USERNAME_REGEX.test(username)) {
    errors.push(
      "Логин должен быть от 4 до 32 символов и содержать только латинские буквы, цифры, точку, дефис или подчёркивание"
    );
  }
  return errors;
}

export function validatePassword(password, username = "") {
  const errors = [];
  if (!password || typeof password !== "string") {
    errors.push("Пароль обязателен");
    return errors;
  }
  if (password.length < 10) {
    errors.push("Пароль должен быть не менее 10 символов");
  }
  if (password.length > 128) {
    errors.push("Пароль слишком длинный (максимум 128 символов)");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Пароль должен содержать хотя бы одну заглавную латинскую букву");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Пароль должен содержать хотя бы одну строчную латинскую букву");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Пароль должен содержать хотя бы одну цифру");
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push("Пароль должен содержать хотя бы один спецсимвол (!@#$%^&* и т.д.)");
  }
  if (/\s/.test(password)) {
    errors.push("Пароль не должен содержать пробелов");
  }
  if (username && password.toLowerCase().includes(username.toLowerCase())) {
    errors.push("Пароль не должен содержать логин");
  }
  if (COMMON_WEAK_PASSWORDS.has(password)) {
    errors.push("Этот пароль слишком простой и часто используется — выберите другой");
  }
  return errors;
}

// Настройки блокировки аккаунта после неудачных попыток входа
export const LOGIN_LOCKOUT = {
  MAX_ATTEMPTS: 5,
  LOCK_MINUTES: 15,
};
