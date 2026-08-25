import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { validatePassword, validateUsername } from "../src/utils/passwordPolicy.js";

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

async function main() {
  const username = process.env.SEED_ADMIN_USERNAME || "admin";
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe!2024";
  const fullName = process.env.SEED_ADMIN_FULLNAME || "Администратор";

  const usernameErrors = validateUsername(username);
  const passwordErrors = validatePassword(password, username);
  if (usernameErrors.length || passwordErrors.length) {
    console.error("Логин/пароль администратора из .env не соответствуют стандартам:");
    [...usernameErrors, ...passwordErrors].forEach((e) => console.error(" - " + e));
    process.exit(1);
  }

  const existingAdmin = await prisma.user.findUnique({ where: { username } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await prisma.user.create({
      data: { fullName, username, passwordHash, role: "ADMIN" },
    });
    console.log(`Создан администратор: ${username} / ${password}`);
    console.log("⚠️  Обязательно смените пароль после первого входа!");
  } else {
    console.log("Администратор уже существует, пропускаем создание.");
  }

  const rateExists = await prisma.exchangeRate.findFirst();
  if (!rateExists) {
    await prisma.exchangeRate.create({ data: { usdToKgs: 89.5 } });
    console.log("Установлен начальный курс: 1 USD = 89.5 KGS");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
