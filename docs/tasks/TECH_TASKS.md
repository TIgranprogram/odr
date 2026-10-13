# ТЕХНИЧЕСКОЕ ЗАДАНИЕ (ТЗ) — оставшиеся работы

> ⚠️ **ИСТОРИЧЕСКИЙ ДОКУМЕНТ (первый аудит).** Часть пунктов уже закрыта,
> часть описана неточно. Актуальное ТЗ — **[`AGENT_TASKS.md`](AGENT_TASKS.md)**.

> Документ составлен по результатам **полного аудита кода от 13.10.2026**.
> Каждая задача имеет чекбокс, критерий приёмки и указание файлов.
> Приоритеты: 🔴 — блокер (без этого не работает), 🟠 — функционал, 🟡 — качество.

---

## Статус частей системы

| Часть | Состояние на 13.10.2026 |
|---|---|
| Git + SSH push на GitHub | ✅ Готово, `main` синхронизирована с `origin` |
| Frontend: инфраструктура сборки | ✅ Восстановлена (`angular.json`, `tsconfig`, `main.ts`, `index.html`) |
| Frontend: зависимости | ✅ Установлены (805 пакетов) |
| Frontend: оболочка (layout, роуты, auth) | ✅ Написана (shell, guard, interceptor, login) |
| Frontend: рабочие страницы | ✅ Все страницы переписаны, `ng build` проходит |
| Backend: компиляция | ✅ 7 блокеров закрыты, `tsc` — 0 ошибок |
| Backend: seed + MongoDB | ✅ Seed работает, админ создан, данные залиты |
| Docker-окружение | ✅ Docker Desktop установлен и запущен |
| Тесты / линтеры | ❌ Не настроены |

---

## 1. 🔴 Инфраструктура и запуск (блокеры)

- [x] **1.1.** Убедиться, что `docker-compose up -d` поднимает MongoDB + backend + frontend без ошибок.
  - Приёмка: `docker compose ps` — все сервисы `running`, `curl http://localhost:3000/health` → `{"status":"ok"}`.
  - Файлы: `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`.
  - **13.10:** ✅ Все 3 контейнера `running`, seed внутри контейнера отработал,
    логин/словари/заявки/склад/ОДР доступны через nginx на :4200.
- [x] **1.2.** Создать `backend/Dockerfile` (multi-stage: `node:20-alpine`, `npm ci`, `tsc`, `CMD ["node","dist/src/server.js"]`).
- [x] **1.3.** Создать `frontend/Dockerfile` (сборка `ng build` + раздача статики nginx) и `frontend/nginx.conf` (прокси `/api` на backend).
  - **13.10:** `frontend/Dockerfile` и `nginx.conf` созданы, `ng build` проходит.
- [ ] **1.4.** Создать `.env.example` в корне (без секретов) и свести `JWT_SECRET` к одному источнику.
  - Приёмка: локальный запуск и Docker-запуск дают взаимозаменяемые токены.
- [x] **1.5.** Настроить MongoDB для локальной разработки: `docker run -d --name odr-mongo -p 27017:27017 mongo:7`.
- [ ] **1.6.** Проверить health-check БД: `/health` должен отражать `mongoose.connection.readyState`, а не только живость процесса.

**Критерий приёмки раздела:** `docker compose up -d` → открыть `http://localhost:4200` → страница логина отрисовывается, `http://localhost:3000/health` отвечает.

---

## 2. 🔴 Backend: компиляция и запуск (7 блокеров из аудита)

- [x] **2.1.** `src/routes/orders.ts` — **файл отсутствует**, а импортируется в `server.ts:10` → сервер не стартует (`MODULE_NOT_FOUND`).
  - Создать роутер: `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id` на `OrderController`.
- [x] **2.2.** `src/routes/invoices.ts:12-15` — на тот же роутер вешается `OrderController` → хендлеры недостижимы. Удалить дубли.
- [x] **2.3.** `src/services/dictionary.service.ts` — **файл написан на Python-псевдокоде** (`from models... import`, `async def`, `.update_one()`). Переписать на TypeScript: `getAll`, `getByCategory`, `getById`, `createItem`, `updateItem`, `deleteItem`.
- [x] **2.4.** `src/services/auth.service.ts` — нет `hashPassword` (вызывается в `auth.controller.ts:34`). Добавить `bcrypt.hash(p, 10)`.
- [x] **2.5.** `src/services/odr.service.ts:24` — `Schema` не импортирован (или удалить неиспользуемую модель `OdrReport`).
- [x] **2.6.** `scripts/seed.ts:3-6` — неверные пути импорта `./src/...` → заменить на `../src/...`.
- [x] **2.7.** Все контроллеры используют `import * as Service`, а сервисы — `export default` → `Service.getAll === undefined` в рантайме.
  - Решение: именованные экспорты в сервисах. Проверить: dictionary, requisition, invoice, order, warehouse, stockItem, odr.
- [x] **2.8.** Создать `backend/tsconfig.json` (`target ES2021`, `module commonjs`, `outDir dist`, `rootDir .`, `strict true`, `esModuleInterop true`).
- [x] **2.9.** Добавить `@types/*` в devDependencies: `node`, `express`, `cors`, `jsonwebtoken`, `bcryptjs`.
- [x] **2.10.** `dotenv.config()` не вызывается → вынести в `src/config/env.ts` и импортировать **первым** в `server.ts` (из-за hoisting'а импортов `JWT_SECRET` читается на уровне модуля).

**Критерий приёмки:** `npx tsc --noEmit` → 0 ошибок; `npm run build` → `dist/`; `npm run start` → сервер отвечает.

**Статус 13.10.2026:** ✅ Всё закрыто и проверено: `tsc` — 0 ошибок, `npm run build` — успех, сервер стартует, `/health` → 200, логин `admin/admin123` → 200, API без токена → 401, невалидные даты ОДР → 400.

---

## 3. 🔴 Frontend: рабочие страницы

- [x] **3.1.** `requisitions.component.ts` — форма создания не отправляет обязательные поля (`category`, `requestedBy`, `company`) → `POST` всегда 400.
  - Решение: добавить поля в форму; `requestedBy` и `company` backend берёт/подставляет по умолчанию (см. 2.x).
- [x] **3.2.** `requisitions.component.ts:138` — «редактирование» открывает форму создания, но **не вызывает `PUT /api/requisitions/:id`** → дубликаты. Добавить `editingId` и `http.put`.
- [x] **3.3.** `requisitions.component.ts:127` — query-параметры склеиваются строкой без `encodeURIComponent` → кириллица ломает URL. Перейти на `HttpParams`.
- [x] **3.4.** Все `subscribe(...)` без error-callback → ошибки молча проглатываются. Добавить `error` + показ уведомления.
- [x] **3.5.** `<table class_table>` в 4 компонентах (requisitions, invoices, dictionaries, orders) — атрибут вместо `class="table_table"` → таблицы без стилей.
- [x] **3.6.** `orders.component.ts:31` — `</</tbody>` → ошибка парсера шаблона, сборка падает.
- [x] **3.7.** `orders.component.ts` — класс `OrderComponent` при файле `orders.component.ts`; маршрут `orders` не подключён (после исправления подключён в `shell.routes.ts` — проверить).
- [x] **3.8.** `warehouse.component.ts` — заглушка «Content coming soon». Реализовать: таблица остатков (`StockItem`: currentStock/freeStock/minStock/status) + журнал движений (`WarehouseMovement`).
- [x] **3.9.** `dictionaries.component.ts:6` — импорт несуществующего `../services/dictionary.service` (сборка падает). Удалить.
- [x] **3.10.** `dictionaries.component.ts:71` — категории захардкожены (`Оборудование`, …), а seed пишет `Types/Units/Suppliers/Customers` → фильтр всегда пуст. **Согласовать со seed** (см. 2.x отчёт).
- [x] **3.11.** `dictionaries.component.ts` — `PUT /api/dictionaries/:id` не вызывается при редактировании → дубликаты.
- [x] **3.12.** `invoices.component.ts` — только чтение. Добавить создание счёта (`POST /api/invoices`) с позициями `items[]`.
- [x] **3.13.** `reports/odr.component.ts:68-70` — вычислены `start`/`end`, но **не передаются в запрос** → всегда отчёт «с начала месяца». Передать `?start=&end=`.
- [x] **3.14.** `reports/odr.component.ts:29` — `report.range.startDate` без `?.` → падение при ошибке API.

**Критерий приёмки:** на каждой странице видны реальные данные из MongoDB; создание/редактирование/удаление работают; ошибки видны пользователю.

**Статус 13.10.2026:** ✅ Все пункты реализованы, `ng build` проходит без ошибок (10 ленивых чанков).

---

## 4. 🟠 Безопасность и аутентификация

- [ ] **4.1.** `authMiddleware` **не подключён ни к одному роуту** → API полностью открыт.
  - Подключить в `server.ts`: `app.use('/api', authMiddleware)` с исключением `/api/auth/*` и `/health`.
- [ ] **4.2.** `POST /api/auth/register` — роль берётся из `req.body` → любой может создать `ADMIN`.
  - Всегда `USER`; валидация пароля (≥6); проверка дубля username → `409`; не отдавать `err.message` наружу.
- [ ] **4.3.** `login` не проверяет `user.isActive` → деактивированные пользователи входят.
- [ ] **4.4.** Refresh-токен подписан тем же секретом и без маркера типа → принимается как access.
  - Добавить `{ type: 'refresh' }`, отдельный `REFRESH_SECRET`, эндпоинт `POST /api/auth/refresh`.
- [ ] **4.5.** Фронт: токен хранится в `localStorage` (XSS-риск). Оценить перевод на `httpOnly`-cookie.
- [ ] **4.6.** `cors()` без ограничений → whitelist `http://localhost:4200`.
- [ ] **4.7.** Нет rate-limiting на `/login` → подключить `express-rate-limit`.

**Критерий приёмки:** без токена любой `/api/*` (кроме auth) → 401; register не даёт роль выше `USER`; фронт после логина работает.

---

## 5. 🟠 Seed и данные

- [ ] **5.1.** `Склад - Склад.csv`: 5 строк-баннеров, реальная шапка — строка 6 → парсер не видит колонок, **0 позиций импортируется молча**.
  - Искать строку-шапку по содержимому; убрать лишний `.slice(1)`.
- [ ] **5.2.** Дата `19.08.2026` (dd.mm.yyyy) → `new Date()` = Invalid Date → CastError. Написать парсер dd.mm.yyyy.
- [ ] **5.3.** Цена `5 760,00 ₽` → `Number()` = NaN → CastError. Очищать пробелы/`₽`, запятая → точка.
- [ ] **5.4.** `invoiceRef: row['№ Счета']` — значения `10478`, `ТЗ2-000379` не ObjectId → CastError. Не заполнять либо резолвить по номеру.
- [ ] **5.5.** `priority`: CSV даёт `Низко`, enum схемы — `Низкий` → привести enum к данным + default.
- [ ] **5.6.** `company` пуст в 4 строках → default `СИЮ`.
- [ ] **5.7.** Seed не создаёт пользователей → **логин невозможен**. Добавить dev-админа (upsert): `admin` / `admin123`, `role: ADMIN`.
- [ ] **5.8.** Повторный запуск seed дублирует данные → очистка/upsert перед заливкой.
- [ ] **5.9.** `db_spotninyg - products.csv` (13 колонок: Артикул_Поставщика, Внутренний_SKU, Категория, Бренд, Поставщик, Цена, …) **не импортируется нигде**, хотя TODO заявляет импорт `products.csv` → реализовать импорт в `Dictionary`/`StockItem`.
- [ ] **5.10.** Хардкод абсолютного пути `D:/ОДР/данные для заполнения на сайте/...` → переменная окружения `DATA_DIR`.

**Критерий приёмки:** `npm run seed` без ошибок; повторный запуск не плодит дубли; залито >0 складских позиций и все 147 заявок; существует `admin/admin123`.

---

## 6. 🟠 API-контракт frontend ↔ backend

- [ ] **6.1.** `search` в заявках фронт шлёт, backend игнорирует → добавить `$or` regex по `itemName/sku/supplier/note`.
- [ ] **6.2.** Base URL `http://localhost:3000` захардкожен в 8 мест → уже вынесен в `core/api.ts`, убрать дубли из компонентов.
- [ ] **6.3.** `/api/stockitems` (lowercase) vs остальные camelCase → унифицировать.
- [ ] **6.4.** Нет `DELETE` в requisitions/invoices/warehouse/stockItems → добавить роуты + сервисы.
- [ ] **6.5.** `findByIdAndUpdate` без `runValidators` → enum/required обходятся при PUT. Добавить `{ new: true, runValidators: true }`.
- [ ] **6.6.** Невалидный ObjectId в `GET /:id` → CastError = 500 → в глобальном error-handler мапить `CastError` → 400.
- [ ] **6.7.** Нет 404-catch-all и глобального error-handler в `server.ts` → добавить (JSON-ответы, `entity.parse.failed` → 400).
- [ ] **6.8.** `express.json()` без `limit` → `{ limit: '1mb' }`.

**Критерий приёмки:** ни один вызов фронта не возвращает 404/500; все ошибки — JSON со стандартным форматом.

---

## 7. 🟠 Бизнес-логика ОДР (сверить с `docs/ODR_LOGIC.md`)

- [ ] **7.1.** Расход считается как `priceWithVat` **без умножения на `quantity`** → сумма занижена в разы. Исправить на `priceWithVat * quantity`.
- [ ] **7.2.** Расход включает любые статусы кроме `⏳ Ожидает`, а по доку — только «Заказано/Получено/Оплачено» → фильтровать по списку.
- [ ] **7.3.** Заявки с заполненным `invoiceRef` считаются вместе со счётами → **двойной учёт**. Исключать покрытые счета.
- [ ] **7.4.** `GET /api/odr?start=&end=` без валидации дат → 500. Валидировать (`isNaN(d.getTime())` → 400).
- [ ] **7.5.** «Прочие поступления» из дока не реализованы.

**Критерий приёмки:** цифры ОДР совпадают с ручным пересчётом по CSV за выбранный период.

---

## 8. 🟡 Качество, тесты, документация

- [ ] **8.1.** Вынести HTTP-вызовы из компонентов в сервисы (`core/api/`) — сейчас `HttpClient` инжектится напрямую в 5 компонентов.
- [ ] **8.2.** `subscribe` без `unsubscribe` → утечки. Использовать `takeUntilDestroyed()`.
- [ ] **8.3.** Убрать `any` (везде `any[]`) → интерфейсы моделей на фронте.
- [ ] **8.4.** Настроить ESLint + Prettier (backend и frontend).
- [ ] **8.5.** Добавить хотя бы smoke-тесты: `GET /health`, `POST /api/auth/login`, `GET /api/requisitions`.
- [ ] **8.6.** `npm audit`: 61 уязвимость на frontend (2 critical), 35 на backend → обновить зависимости.
- [ ] **8.7.** Стилизация: заявлен TailwindCSS, но он не подключён (и нет `styles.css`-интеграции) → либо подключить, либо поправить документацию.
- [ ] **8.8.** Привести документацию в соответствие реальности:
  - `docs/CURRENT_STATE.md` заявляет **NestJS** — реально Express.
  - `docs/TECH_STACK & GUIDELINES.md` — «Си хочет-тоны» (опечатка), PrimeNG/Material не подключены.
  - `TODO_CHECKLIST.md` помечает как сделанное то, чего нет (Tailwind, Layout, Pino, валидацию пароля).
  - Добавить `docs/pages/<name>.page.md` (правило из TECH_STACK, не выполняется).
- [ ] **8.9.** README: инструкции `docker-compose up` сейчас невыполнимы → обновить после 1.1–1.3.

---

## Порядок выполнения (рекомендуемый)

1. **День 1 (сейчас, 13.10):** §2 (компиляция backend) → §5.7 (admin) → smoke-проверка API.
2. **День 2 (14.10):** §3 (страницы frontend) → §1.2–1.3 (Dockerfile) → §1.1 end-to-end.
3. **День 3 (15.10):** §4 (безопасность) → §6 (контракты) → §7 (бизнес-логика ОДР).
4. **День 4:** §8 (тесты, линтеры, документация) → финальный полный прогон.

---

*Дата составления: 13.10.2026. Источник: полный аудит backend + frontend (2 независимых обхода).*
