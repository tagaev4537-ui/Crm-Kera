import { prisma } from "../config/prisma.js";
import { getCurrentRate, convert } from "../utils/exchangeRate.js";

const STAGES = ["NEW", "CONTACTED", "VIEWING", "NEGOTIATION", "DEAL", "WON", "LOST"];

function scopeWhere(req) {
  if (req.user.role === "ADMIN") return {};
  return { managerId: req.user.id };
}

async function withKgs(deals) {
  const rate = await getCurrentRate();
  const list = Array.isArray(deals) ? deals : [deals];
  const mapped = list.map((d) => ({ ...d, amount: convert(d.amountUsd, rate) }));
  return Array.isArray(deals) ? mapped : mapped[0];
}

const dealInclude = {
  client: { select: { id: true, fullName: true, phone: true } },
  property: { select: { id: true, title: true, address: true, priceUsd: true } },
  manager: { select: { id: true, fullName: true } },
};

export async function listDeals(req, res, next) {
  try {
    const { stage, managerId, clientId, propertyId } = req.query;
    const where = {
      ...scopeWhere(req),
      ...(stage && { stage }),
      ...(req.user.role === "ADMIN" && managerId && { managerId }),
      ...(clientId && { clientId }),
      ...(propertyId && { propertyId }),
    };

    const deals = await prisma.deal.findMany({
      where,
      include: dealInclude,
      orderBy: { updatedAt: "desc" },
    });
    res.json({ deals: await withKgs(deals) });
  } catch (err) {
    next(err);
  }
}

// Сгруппированный по этапам список для канбан-доски воронки продаж
export async function pipeline(req, res, next) {
  try {
    const { managerId } = req.query;
    const where = {
      ...scopeWhere(req),
      ...(req.user.role === "ADMIN" && managerId && { managerId }),
      stage: { notIn: ["WON", "LOST"] },
    };
    const deals = await prisma.deal.findMany({
      where,
      include: dealInclude,
      orderBy: { updatedAt: "desc" },
    });
    const withRates = await withKgs(deals);

    const columns = {};
    for (const stage of STAGES) columns[stage] = [];
    for (const deal of withRates) columns[deal.stage]?.push(deal);

    res.json({ columns, stages: STAGES });
  } catch (err) {
    next(err);
  }
}

export async function getDeal(req, res, next) {
  try {
    const { id } = req.params;
    const deal = await prisma.deal.findFirst({
      where: { id, ...scopeWhere(req) },
      include: {
        ...dealInclude,
        history: {
          include: { changedBy: { select: { id: true, fullName: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!deal) return res.status(404).json({ error: "Сделка не найдена" });
    res.json({ deal: await withKgs(deal) });
  } catch (err) {
    next(err);
  }
}

export async function createDeal(req, res, next) {
  try {
    const { title, clientId, propertyId, amountUsd, currency, probability, expectedCloseDate } = req.body;

    if (!title || !clientId || !amountUsd) {
      return res.status(400).json({ error: "Укажите название, клиента и сумму сделки" });
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return res.status(404).json({ error: "Клиент не найден" });

    if (propertyId) {
      const property = await prisma.property.findUnique({ where: { id: propertyId } });
      if (!property) return res.status(404).json({ error: "Квартира не найдена" });
    }

    const rate = await getCurrentRate();
    const deal = await prisma.deal.create({
      data: {
        title: title.trim(),
        clientId,
        propertyId: propertyId || null,
        managerId: req.user.role === "ADMIN" && req.body.managerId ? req.body.managerId : req.user.id,
        amountUsd: Number(amountUsd),
        currency: currency || "USD",
        exchangeRateUsed: rate,
        probability: probability !== undefined ? Number(probability) : 20,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
      },
      include: dealInclude,
    });

    await prisma.dealHistory.create({
      data: { dealId: deal.id, toStage: "NEW", changedById: req.user.id, note: "Сделка создана" },
    });

    res.status(201).json({ deal: await withKgs(deal) });
  } catch (err) {
    next(err);
  }
}

export async function updateDeal(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.deal.findFirst({ where: { id, ...scopeWhere(req) } });
    if (!existing) return res.status(404).json({ error: "Сделка не найдена" });

    const { title, propertyId, amountUsd, currency, probability, expectedCloseDate, managerId } = req.body;

    const deal = await prisma.deal.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(propertyId !== undefined && { propertyId: propertyId || null }),
        ...(amountUsd !== undefined && { amountUsd: Number(amountUsd) }),
        ...(currency !== undefined && { currency }),
        ...(probability !== undefined && { probability: Number(probability) }),
        ...(expectedCloseDate !== undefined && {
          expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        }),
        ...(req.user.role === "ADMIN" && managerId !== undefined && { managerId }),
      },
      include: dealInclude,
    });
    res.json({ deal: await withKgs(deal) });
  } catch (err) {
    next(err);
  }
}

// Смена этапа сделки — с логированием истории и обновлением статуса квартиры
export async function changeStage(req, res, next) {
  try {
    const { id } = req.params;
    const { stage, note, lostReason } = req.body;

    if (!STAGES.includes(stage)) {
      return res.status(400).json({ error: "Недопустимый этап сделки" });
    }

    const existing = await prisma.deal.findFirst({
      where: { id, ...scopeWhere(req) },
      include: { property: true },
    });
    if (!existing) return res.status(404).json({ error: "Сделка не найдена" });

    if (stage === "LOST" && !lostReason) {
      return res.status(400).json({ error: "Укажите причину потери сделки" });
    }

    const isClosing = stage === "WON" || stage === "LOST";

    const deal = await prisma.$transaction(async (tx) => {
      const updated = await tx.deal.update({
        where: { id },
        data: {
          stage,
          ...(isClosing && { closedAt: new Date() }),
          ...(stage === "LOST" && { lostReason }),
        },
        include: dealInclude,
      });

      await tx.dealHistory.create({
        data: {
          dealId: id,
          fromStage: existing.stage,
          toStage: stage,
          changedById: req.user.id,
          note: note || null,
        },
      });

      // Если сделка выиграна и привязана к квартире — помечаем квартиру проданной
      if (stage === "WON" && existing.propertyId) {
        await tx.property.update({
          where: { id: existing.propertyId },
          data: { status: "SOLD" },
        });
      }
      // Если сделка вышла на переговоры/оформление — резервируем квартиру
      if ((stage === "NEGOTIATION" || stage === "DEAL") && existing.propertyId && existing.property?.status === "AVAILABLE") {
        await tx.property.update({
          where: { id: existing.propertyId },
          data: { status: "RESERVED" },
        });
      }

      return updated;
    });

    res.json({ deal: await withKgs(deal) });
  } catch (err) {
    next(err);
  }
}

export async function deleteDeal(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.deal.findFirst({ where: { id, ...scopeWhere(req) } });
    if (!existing) return res.status(404).json({ error: "Сделка не найдена" });

    await prisma.comment.deleteMany({ where: { entityType: "DEAL", entityId: id } });
    await prisma.dealHistory.deleteMany({ where: { dealId: id } });
    await prisma.deal.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
