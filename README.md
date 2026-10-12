# ODR — Система автоматизации снабжения и учета

Система для управления поставками, счетами, складскими остатками и аналитикой
доходов/расходов (ОДР).

> **Статус проекта: в разработке.** Полный аудит проведён 13.10.2026,
> список оставшихся работ — **[`docs/tasks/TECH_TASKS.md`](docs/tasks/TECH_TASKS.md)**,
> текущее состояние — **[`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md)**.

## 🛠 Стек

| Слой | Технологии |
|---|---|
| Backend | Node.js + Express + TypeScript + Mongoose |
| Frontend | Angular 17 (standalone components, Signals) |
| Database | MongoDB 7 |
| Инфраструктура | Docker Desktop + Docker Compose |
| Auth | JWT (Access + Refresh) + bcryptjs |

## 🚀 Быстрый старт

> ⚠️ Порядок ниже — целевой. Часть шагов ещё в работе (см. `TECH_TASKS.md` §1–§2).

**1. Зависимости**
```bash
cd backend  && npm install
cd ../frontend && npm install
```
> В PowerShell запускайте npm через `cmd /c "npm install"` —
> политика выполнения блокирует `npm.ps1`.

**2. MongoDB**
```bash
docker run -d --name odr-mongo -p 27017:27017 mongo:7
```

**3. Наполнение данных + создание админа**
```bash
cd backend && npm run seed     # заливает CSV, создаёт admin / admin123
```

**4. Backend**
```bash
cd backend && npm run dev      # http://localhost:3000
```

**5. Frontend**
```bash
cd frontend && npm start       # http://localhost:4200
```

**6. Всё в Docker** *(требует `Dockerfile` — задача 1.2/1.3)*
```bash
docker-compose up -d
```

## 📂 Структура проекта

```
backend/            Express + TypeScript + Mongoose
  src/
    config/         переменные окружения
    routes/         роутеры Express
    controllers/    разбор запроса и ответы
    services/       бизнес-логика (единственный доступ к БД)
    models/         схемы Mongoose
    middleware/     auth (JWT), role
  scripts/seed.ts   импорт CSV из «данные для заполнения на сайте»
frontend/           Angular 17
  src/app/
    core/           auth-сервис, guard, интерцептор, API_URL
    features/
      shell/        layout: sidebar + header + router-outlet
      requisitions|orders|invoices|warehouse|dictionaries|reports|auth
docs/               Roadmap, Domain Map, ODR Logic, Tech Stack
docs/tasks/         TODO_CHECKLIST.md, TECH_TASKS.md ← оставшиеся работы
```

## 🔐 Доступ

После `npm run seed`: **`admin` / `admin123`** (dev-учётная запись, роль `ADMIN`).

## 📖 Документация

| Файл | Содержание |
|---|---|
| [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) | «Файл сохранения» — где мы сейчас |
| [`docs/tasks/TECH_TASKS.md`](docs/tasks/TECH_TASKS.md) | **ТЗ: что осталось сделать** |
| [`docs/tasks/TODO_CHECKLIST.md`](docs/tasks/TODO_CHECKLIST.md) | Чек-лист статусов |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Этапы: Инфраструктура → Снабжение → Аналитика |
| [`docs/DOMAIN_MAP.md`](docs/DOMAIN_MAP.md) | Карта доменов и связей |
| [`docs/ODR_LOGIC.md`](docs/ODR_LOGIC.md) | Правила расчёта ОДР |
| [`docs/TECH_STACK & GUIDELINES.md`](docs/TECH_STACK%20%26%20GUIDELINES.md) | Архитектурные правила |
