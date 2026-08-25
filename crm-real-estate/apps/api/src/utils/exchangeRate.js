import { prisma } from "../config/prisma.js";

const DEFAULT_USD_TO_KGS = 89.5; // используется только если в БД ещё нет курса

export async function getCurrentRate() {
  const latest = await prisma.exchangeRate.findFirst({ orderBy: { createdAt: "desc" } });
  return latest?.usdToKgs || DEFAULT_USD_TO_KGS;
}

export function convert(amountUsd, rateUsdToKgs) {
  return {
    usd: Math.round(amountUsd * 100) / 100,
    kgs: Math.round(amountUsd * rateUsdToKgs * 100) / 100,
  };
}
