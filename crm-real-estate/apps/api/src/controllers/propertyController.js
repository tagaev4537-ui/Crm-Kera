import { prisma } from "../config/prisma.js";
import { getCurrentRate, convert } from "../utils/exchangeRate.js";

async function withKgs(properties) {
  const rate = await getCurrentRate();
  const list = Array.isArray(properties) ? properties : [properties];
  const mapped = list.map((p) => ({ ...p, price: convert(p.priceUsd, rate) }));
  return Array.isArray(properties) ? mapped : mapped[0];
}

export async function listProperties(req, res, next) {
  try {
    const { search, status, district, rooms, minPrice, maxPrice } = req.query;
    const where = {
      ...(status && { status }),
      ...(district && { district: { contains: district, mode: "insensitive" } }),
      ...(rooms && { rooms: Number(rooms) }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { address: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...((minPrice || maxPrice) && {
        priceUsd: {
          ...(minPrice && { gte: Number(minPrice) }),
          ...(maxPrice && { lte: Number(maxPrice) }),
        },
      }),
    };

    const properties = await prisma.property.findMany({
      where,
      include: { _count: { select: { deals: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ properties: await withKgs(properties) });
  } catch (err) {
    next(err);
  }
}

export async function getProperty(req, res, next) {
  try {
    const { id } = req.params;
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        deals: {
          include: {
            client: { select: { id: true, fullName: true, phone: true } },
            manager: { select: { id: true, fullName: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!property) return res.status(404).json({ error: "Квартира не найдена" });
    res.json({ property: await withKgs(property) });
  } catch (err) {
    next(err);
  }
}

export async function createProperty(req, res, next) {
  try {
    const { title, address, district, rooms, areaM2, floor, totalFloors, priceUsd, description, photos } =
      req.body;

    if (!title || !address || !rooms || !areaM2 || !priceUsd) {
      return res.status(400).json({
        error: "Укажите название, адрес, количество комнат, площадь и цену в USD",
      });
    }

    const property = await prisma.property.create({
      data: {
        title: title.trim(),
        address: address.trim(),
        district: district || null,
        rooms: Number(rooms),
        areaM2: Number(areaM2),
        floor: floor !== undefined && floor !== "" ? Number(floor) : null,
        totalFloors: totalFloors !== undefined && totalFloors !== "" ? Number(totalFloors) : null,
        priceUsd: Number(priceUsd),
        description: description || null,
        photos: Array.isArray(photos) ? photos : [],
      },
    });
    res.status(201).json({ property: await withKgs(property) });
  } catch (err) {
    next(err);
  }
}

export async function updateProperty(req, res, next) {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    ["rooms", "floor", "totalFloors"].forEach((f) => {
      if (data[f] !== undefined && data[f] !== "") data[f] = Number(data[f]);
    });
    if (data.areaM2 !== undefined) data.areaM2 = Number(data.areaM2);
    if (data.priceUsd !== undefined) data.priceUsd = Number(data.priceUsd);

    const property = await prisma.property.update({ where: { id }, data });
    res.json({ property: await withKgs(property) });
  } catch (err) {
    next(err);
  }
}

export async function deleteProperty(req, res, next) {
  try {
    const { id } = req.params;
    const dealsCount = await prisma.deal.count({ where: { propertyId: id } });
    if (dealsCount > 0) {
      return res.status(409).json({ error: "Нельзя удалить квартиру, связанную со сделками" });
    }
    await prisma.comment.deleteMany({ where: { entityType: "PROPERTY", entityId: id } });
    await prisma.property.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
