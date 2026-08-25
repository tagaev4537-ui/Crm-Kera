import { prisma } from "../config/prisma.js";
import { getCurrentRate } from "../utils/exchangeRate.js";

export async function getRate(req, res, next) {
  try {
    const usdToKgs = await getCurrentRate();
    res.json({ usdToKgs });
  } catch (err) {
    next(err);
  }
}

export async function getRateHistory(req, res, next) {
  try {
    const history = await prisma.exchangeRate.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    res.json({ history });
  } catch (err) {
    next(err);
  }
}

export async function setRate(req, res, next) {
  try {
    const { usdToKgs } = req.body;
    const value = Number(usdToKgs);
    if (!value || value <= 0) {
      return res.status(400).json({ error: "Укажите корректный положительный курс" });
    }
    const rate = await prisma.exchangeRate.create({
      data: { usdToKgs: value, setById: req.user.id },
    });
    res.status(201).json({ rate });
  } catch (err) {
    next(err);
  }
}
