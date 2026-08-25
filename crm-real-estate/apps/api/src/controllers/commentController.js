import { prisma } from "../config/prisma.js";

const VALID_ENTITY_TYPES = ["CLIENT", "PROPERTY", "DEAL"];

async function assertEntityExists(entityType, entityId) {
  if (entityType === "CLIENT") {
    return prisma.client.findUnique({ where: { id: entityId } });
  }
  if (entityType === "PROPERTY") {
    return prisma.property.findUnique({ where: { id: entityId } });
  }
  if (entityType === "DEAL") {
    return prisma.deal.findUnique({ where: { id: entityId } });
  }
  return null;
}

export async function listComments(req, res, next) {
  try {
    const { entityType, entityId } = req.query;
    if (!VALID_ENTITY_TYPES.includes(entityType) || !entityId) {
      return res.status(400).json({ error: "Укажите корректные entityType и entityId" });
    }
    const comments = await prisma.comment.findMany({
      where: { entityType, entityId },
      include: { author: { select: { id: true, fullName: true, username: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ comments });
  } catch (err) {
    next(err);
  }
}

export async function createComment(req, res, next) {
  try {
    const { entityType, entityId, text } = req.body;
    if (!VALID_ENTITY_TYPES.includes(entityType) || !entityId) {
      return res.status(400).json({ error: "Укажите корректные entityType и entityId" });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Комментарий не может быть пустым" });
    }

    const parent = await assertEntityExists(entityType, entityId);
    if (!parent) {
      return res.status(404).json({ error: "Связанная запись не найдена" });
    }

    const comment = await prisma.comment.create({
      data: { entityType, entityId, text: text.trim(), authorId: req.user.id },
      include: { author: { select: { id: true, fullName: true, username: true } } },
    });
    res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
}

export async function deleteComment(req, res, next) {
  try {
    const { id } = req.params;
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) return res.status(404).json({ error: "Комментарий не найден" });

    // Автор или админ может удалить комментарий
    if (comment.authorId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Можно удалять только свои комментарии" });
    }

    await prisma.comment.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
