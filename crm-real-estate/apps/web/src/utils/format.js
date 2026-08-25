export function formatUsd(value) {
  return new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(
    Math.round(value || 0)
  ) + " $";
}

export function formatKgs(value) {
  return new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(
    Math.round(value || 0)
  ) + " сом";
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(dateStr)
  );
}

export function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export const DEAL_STAGE_LABELS = {
  NEW: "Новая заявка",
  CONTACTED: "Связались",
  VIEWING: "Показ",
  NEGOTIATION: "Переговоры / бронь",
  DEAL: "Оформление",
  WON: "Успешно закрыта",
  LOST: "Потеряна",
};

export const DEAL_STAGE_ORDER = ["NEW", "CONTACTED", "VIEWING", "NEGOTIATION", "DEAL", "WON", "LOST"];

export const DEAL_STAGE_COLORS = {
  NEW: "bg-ink-faint",
  CONTACTED: "bg-blue-400",
  VIEWING: "bg-accent",
  NEGOTIATION: "bg-warning",
  DEAL: "bg-purple-400",
  WON: "bg-success",
  LOST: "bg-danger",
};

export const PROPERTY_STATUS_LABELS = {
  AVAILABLE: "В продаже",
  RESERVED: "Бронь",
  SOLD: "Продана",
  ARCHIVED: "Снята с продажи",
};

export const PROPERTY_STATUS_TONE = {
  AVAILABLE: "success",
  RESERVED: "warning",
  SOLD: "default",
  ARCHIVED: "danger",
};

export const CLIENT_STATUS_LABELS = {
  NEW: "Новый",
  IN_PROGRESS: "В работе",
  CLIENT: "Клиент",
  LOST: "Потерян",
};

export const ROLE_LABELS = {
  ADMIN: "Администратор",
  MANAGER: "Менеджер",
};

// Показывает сумму в выбранной основной валюте, вторую — мелким текстом рядом
export function formatPrimary(price, currency) {
  if (!price) return { main: "—", secondary: "" };
  if (currency === "USD") {
    return { main: formatUsd(price.usd), secondary: `≈ ${formatKgs(price.kgs)}` };
  }
  return { main: formatKgs(price.kgs), secondary: `≈ ${formatUsd(price.usd)}` };
}
