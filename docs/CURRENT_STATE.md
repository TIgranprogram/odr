# CURRENT_STATE (Save Game)

> Это файл «сохранения» проекта. Обновляется после каждого значимого этапа,
> чтобы продолжить работу даже при потере контекста.

## 📍 Текущий статус
**Этап:** Полный аудит кода завершён, начата починка до рабочего состояния.
**Дата:** 13.10.2026
**Ветка:** `main` → `origin/main` (GitHub: `TIgranprogram/odr`, приватность: public)

## 🔄 Последнее действие
1. Настроен SSH-доступ к GitHub (ключ `~/.ssh/odr_github`, аккаунт `TIgranprogram`).
2. Создан `.gitignore`, `.env` исключён из индекса, выполнен первый коммит и push.
3. Проведён **полный аудит** двух независимых обходов (backend + frontend).
4. Восстановлена инфраструктура сборки frontend (её не существовало).
5. Результаты аудита сведены в **`docs/tasks/TECH_TASKS.md`**.

## ⏭️ Следующие шаги
1. Починить компиляцию backend — 7 блокеров (`TECH_TASKS.md` §2).
2. Починить seed: парсинг CSV + создание админа (`§5`).
3. Реализовать рабочие страницы frontend (`§3`).
4. Подключить auth middleware, Dockerfile, docker-compose end-to-end (`§1`, `§4`).
5. Сверить бизнес-логику ОДР с `ODR_LOGIC.md` (`§7`).
6. Тесты, линтеры, документация (`§8`).

## 🚨 Ключевые проблемы из аудита (блокеры)

**Backend не компилируется:**
- `server.ts:10` импортирует несуществующий `routes/orders.ts` → `MODULE_NOT_FOUND`
- `services/dictionary.service.ts` **написан на Python-псевдокоде**
- нет `hashPassword` в `auth.service` (вызывается контроллером)
- нет `tsconfig.json`, нет `@types/*`
- контроллеры: `import * as Service` поверх `export default` → `undefined`
- `dotenv.config()` не вызывается → `JWT_SECRET` всегда дефолтный

**Безопасность:**
- `authMiddleware` не подключён ни к одному роуту → API открыт всем
- `register` принимает `role` из тела запроса → любой может стать ADMIN
- refresh-токен неотличим от access

**Frontend (частично исправлено):**
- не существовало: `angular.json`, `tsconfig`, `main.ts`, `index.html`,
  корневой компонент, layout, маршруты `orders`, guard'ы, JWT-interceptor
- осталось: страницы с замоканными/недоделанными формами, заглушка склада,
  отсутствие обработки ошибок, `class_table` вместо `class="table_table"`

**Данные:**
- seed падает: даты `dd.mm.yyyy`, цены `5 760,00 ₽`, `invoiceRef` не ObjectId
- складской CSV имеет 5 строк-баннеров → 0 позиций импортируется молча
- **пользователи не создаются → залогиниться невозможно**

**Бизнес-логика ОДР:**
- расход считается без `quantity` → сумма занижена в разы
- заявки с `invoiceRef` считаются вместе со счетами → двойной учёт

## 📝 Контекст и решения
- **Стек (фактический):** Express + TypeScript + Mongoose (backend),
  Angular 17 standalone (frontend), MongoDB 7, Docker Desktop.
  ⚠️ `CURRENT_STATE` ранее заявлял NestJS — это не соответствовало коду.
- **State Management:** обновляем этот файл после каждого этапа.
- **Snapshot Immutability:** неизменяемые снимки при переходах статусов
  (чтобы история не менялась при правке справочников).
- **Domain Map:** обязателен для поиска связей (`docs/DOMAIN_MAP.md`).
- **Договорённость по справочнику:** seed пишет категории
  `Types / Units / Suppliers / Customers` — фронт нужно синхронизировать.
- **Dev-доступ:** `admin` / `admin123` (создаётся seed'ом, задача 5.7).

## 🛠 Окружение
| Компонент | Значение |
|---|---|
| Node | v24.21.0 (npm через `cmd /c "npm ..."`) |
| Docker | Desktop 29.8.2, Compose v5.6.0 |
| MongoDB | контейнер `odr-mongo` (нужно поднять: `docker run -d --name odr-mongo -p 27017:27017 mongo:7`) |
| Backend | `http://localhost:3000` |
| Frontend | `http://localhost:4200` |
| PowerShell | блокирует `npm.ps1` → использовать `cmd /c` |
