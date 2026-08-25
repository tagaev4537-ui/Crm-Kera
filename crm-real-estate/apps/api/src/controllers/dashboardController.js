import { prisma } from "../config/prisma.js";
import { getCurrentRate, convert } from "../utils/exchangeRate.js";

function scopeWhere(req) {
  if (req.user.role === "ADMIN") return {};
  return { managerId: req.user.id };
}

export async function summary(req, res, next) {
  try {
    const base = scopeWhere(req);
    const rate = await getCurrentRate();

    const [clientsCount, propertiesAvailable, dealsOpen, dealsWon, dealsLost, wonSumAgg] = await Promise.all([
      prisma.client.count({ where: req.user.role === "ADMIN" ? {} : { managerId: req.user.id } }),
      prisma.property.count({ where: { status: "AVAILABLE" } }),
      prisma.deal.count({ where: { ...base, stage: { notIn: ["WON", "LOST"] } } }),
      prisma.deal.count({ where: { ...base, stage: "WON" } }),
      prisma.deal.count({ where: { ...base, stage: "LOST" } }),
      prisma.deal.aggregate({ where: { ...base, stage: "WON" }, _sum: { amountUsd: true } }),
    ]);

    const wonAmountUsd = wonSumAgg._sum.amountUsd || 0;

    // Разбивка открытых сделок по этапам
    const byStageRaw = await prisma.deal.groupBy({
      by: ["stage"],
      where: { ...base, stage: { notIn: ["WON", "LOST"] } },
      _count: { _all: true },
      _sum: { amountUsd: true },
    });
    const byStage = byStageRaw.map((s) => ({
      stage: s.stage,
      count: s._count._all,
      amount: convert(s._sum.amountUsd || 0, rate),
    }));

    res.json({
      clientsCount,
      propertiesAvailable,
      dealsOpen,
      dealsWon,
      dealsLost,
      wonAmount: convert(wonAmountUsd, rate),
      byStage,
      exchangeRate: rate,
    });
  } catch (err) {
    next(err);
  }
}

// Для админа: сводка по каждому менеджеру
export async function managerPerformance(req, res, next) {
  try {
    const rate = await getCurrentRate();
    const managers = await prisma.user.findMany({ where: { role: "MANAGER" } });

    const stats = await Promise.all(
      managers.map(async (m) => {
        const [clientsCount, dealsWon, dealsOpen, wonSumAgg] = await Promise.all([
          prisma.client.count({ where: { managerId: m.id } }),
          prisma.deal.count({ where: { managerId: m.id, stage: "WON" } }),
          prisma.deal.count({ where: { managerId: m.id, stage: { notIn: ["WON", "LOST"] } } }),
          prisma.deal.aggregate({ where: { managerId: m.id, stage: "WON" }, _sum: { amountUsd: true } }),
        ]);
        return {
          manager: { id: m.id, fullName: m.fullName, username: m.username },
          clientsCount,
          dealsWon,
          dealsOpen,
          wonAmount: convert(wonSumAgg._sum.amountUsd || 0, rate),
        };
      })
    );

    res.json({ stats });
  } catch (err) {
    next(err);
  }
}
