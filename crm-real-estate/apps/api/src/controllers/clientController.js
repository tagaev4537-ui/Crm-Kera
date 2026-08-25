import { prisma } from "../config/prisma.js";

function scopeWhere(req) {
  // Менеджер видит только своих клиентов, админ — всех
  if (req.user.role === "ADMIN") return {};
  return { managerId: req.user.id };
}

export async function listClients(req, res, next) {
  try {
    const { search, status, managerId } = req.query;
    const where = {
      ...scopeWhere(req),
      ...(status && { status }),
      ...(req.user.role === "ADMIN" && managerId && { managerId }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const clients = await prisma.client.findMany({
      where,
      include: {
        manager: { select: { id: true, fullName: true } },
        _count: { select: { deals: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ clients });
  } catch (err) {
    next(err);
  }
}

export async function getClient(req, res, next) {
  try {
    const { id } = req.params;
    const client = await prisma.client.findFirst({
      where: { id, ...scopeWhere(req) },
      include: {
        manager: { select: { id: true, fullName: true } },
        deals: {
          include: { property: { select: { id: true, title: true, address: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!client) return res.status(404).json({ error: "Клиент не найден" });
    res.json({ client });
  } catch (err) {
    next(err);
  }
}

export async function createClient(req, res, next) {
  try {
    const { fullName, phone, email, source, status } = req.body;
    if (!fullName || !phone) {
      return res.status(400).json({ error: "Укажите имя и телефон клиента" });
    }
    const client = await prisma.client.create({
      data: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        source: source || null,
        status: status || "NEW",
        managerId: req.user.role === "ADMIN" && req.body.managerId ? req.body.managerId : req.user.id,
      },
    });
    res.status(201).json({ client });
  } catch (err) {
    next(err);
  }
}

export async function updateClient(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.client.findFirst({ where: { id, ...scopeWhere(req) } });
    if (!existing) return res.status(404).json({ error: "Клиент не найден" });

    const { fullName, phone, email, source, status, managerId } = req.body;
    const client = await prisma.client.update({
      where: { id },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(source !== undefined && { source }),
        ...(status !== undefined && { status }),
        ...(req.user.role === "ADMIN" && managerId !== undefined && { managerId }),
      },
    });
    res.json({ client });
  } catch (err) {
    next(err);
  }
}

export async function deleteClient(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.client.findFirst({ where: { id, ...scopeWhere(req) } });
    if (!existing) return res.status(404).json({ error: "Клиент не найден" });

    const dealsCount = await prisma.deal.count({ where: { clientId: id } });
    if (dealsCount > 0) {
      return res.status(409).json({ error: "Нельзя удалить клиента с активными сделками" });
    }

    await prisma.comment.deleteMany({ where: { entityType: "CLIENT", entityId: id } });
    await prisma.client.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
