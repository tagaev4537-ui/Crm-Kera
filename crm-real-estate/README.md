# КварталCRM — CRM для менеджеров по продажам квартир

CRM-система для отдела продаж недвижимости: база клиентов, база квартир,
воронка продаж (сделки), комментарии/примечания к каждой сущности,
поддержка валют **USD** и **KGS** (сом), вход по логину и паролю со
строгими стандартами безопасности.

## Стек

- **Backend**: Node.js + Express, PostgreSQL + Prisma ORM, JWT-аутентификация
- **Frontend**: React + Vite + Tailwind CSS
- **Монорепозиторий**: pnpm workspaces (`apps/api`, `apps/web`)
- **Деплой**: Railway

## Возможности

- 🔐 Вход по логину/паролю со строгими стандартами (см. ниже), блокировка
  аккаунта после 5 неудачных попыток, JWT access + httpOnly refresh токены
- 👥 Роли: **Администратор** и **Менеджер** (менеджер видит только своих
  клиентов и свои сделки; администратор видит всё и управляет командой)
- 🏢 База квартир: адрес, район, площадь, этаж, цена в USD с автопересчётом
  в KGS по текущему курсу
- 🧑‍💼 База клиентов с источником, статусом и историей сделок
- 📈 Воронка продаж (канбан): Новая заявка → Связались → Показ → Переговоры
  → Оформление → Успешно/Отказ, с историей изменения этапов
- 💬 Комментарии и примечания к клиентам, квартирам и сделкам
- 💵 Управляемый курс USD → KGS (задаёт администратор)
- 📊 Дашборд со сводной статистикой и показателями по каждому менеджеру

## Стандарты логина и пароля

**Логин:** 4–32 символа, латинские буквы, цифры, `.` `_` `-` (без пробелов).

**Пароль:** минимум 10 символов, обязательно содержит:
- заглавную букву (A-Z)
- строчную букву (a-z)
- цифру (0-9)
- спецсимвол (`!@#$%^&*()_+-=[]{};':"\|,.<>/?`)
- не должен содержать логин и не входит в список частых слабых паролей

Пароли хранятся только в виде bcrypt-хэша (12 раундов). После 5 неверных
попыток входа аккаунт блокируется на 15 минут. При сбросе пароля
администратором генерируется временный пароль, соответствующий этим же
стандартам, и сотрудник обязан сменить его при следующем входе.

## Локальный запуск

### 1. Установить зависимости

```bash
pnpm install
```

### 2. Настроить окружение

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Отредактируйте `apps/api/.env`:
- `DATABASE_URL` — строка подключения к вашей PostgreSQL
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — сгенерируйте случайные строки:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD` — логин/пароль первого
  администратора (должны соответствовать стандартам выше)

### 3. Применить миграции и создать администратора

```bash
cd apps/api
pnpm prisma:migrate:dev
pnpm prisma:seed
cd ../..
```

### 4. Запустить в режиме разработки

```bash
pnpm dev:api    # http://localhost:4000
pnpm dev:web    # http://localhost:5173
```

Войдите под логином/паролем, указанным в `SEED_ADMIN_USERNAME` /
`SEED_ADMIN_PASSWORD`.

## Загрузка на GitHub

```bash
git remote add origin https://github.com/<ваш-логин>/<название-репозитория>.git
git branch -M main
git push -u origin main
```

## Деплой на Railway

Проект — монорепозиторий с двумя сервисами (API и веб) и базой данных
PostgreSQL. В Railway нужно создать **три** ресурса в одном проекте.

### 1. База данных

New → Database → **PostgreSQL**. Railway создаст переменную
`DATABASE_URL` внутри своего окружения — её нужно будет прокинуть в
сервис API (см. ниже).

### 2. Сервис API (backend)

New → GitHub Repo → выберите репозиторий.

В настройках сервиса (**Settings**):
- **Root Directory**: `/` (корень репозитория — важно для pnpm workspace)
- **Build Command**: `pnpm install --frozen-lockfile && pnpm --filter api build`
- **Start Command**: `pnpm --filter api prisma:migrate && pnpm --filter api start`

В **Variables** добавьте:
- `DATABASE_URL` — через Reference → выберите переменную из сервиса PostgreSQL
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — случайные длинные строки
- `JWT_ACCESS_EXPIRES=15m`, `JWT_REFRESH_EXPIRES_DAYS=7`
- `WEB_ORIGIN` — публичный URL сервиса веб-фронтенда (заполните после шага 3)
- `SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_FULLNAME`
- `NODE_ENV=production`

После первого деплоя один раз выполните сид командой в Railway Shell
сервиса API:
```bash
pnpm --filter api prisma:seed
```

### 3. Сервис Web (frontend)

New → GitHub Repo → тот же репозиторий (второй сервис).

- **Root Directory**: `/`
- **Build Command**: `pnpm install --frozen-lockfile && pnpm --filter web build`
- **Start Command**: `pnpm --filter web start`

В **Variables**:
- `VITE_API_URL` — публичный URL API-сервиса + `/api`, например
  `https://your-api.up.railway.app/api`

После деплоя веб-сервиса скопируйте его публичный URL и обновите
переменную `WEB_ORIGIN` у сервиса API (для корректной работы CORS и
cookie), затем передеплойте API.

### 4. Проверка

Откройте публичный URL веб-сервиса, войдите под администратором
(`SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD`), сразу смените пароль и
создайте аккаунты менеджеров через раздел **Команда**.

## Структура проекта

```
crm-real-estate/
  apps/
    api/                 # Express + Prisma backend
      prisma/schema.prisma
      prisma/seed.js
      src/
        config/           # Prisma client
        controllers/       # Бизнес-логика
        middleware/         # auth, rate-limit, validate
        routes/
        utils/              # пароли, JWT, курс валют
    web/                  # React + Vite frontend
      src/
        api/                # axios-клиент с авто-обновлением токена
        components/
        context/            # AuthContext
        pages/
        utils/
```
