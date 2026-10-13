# AGENT_TASKS — Аудит и ТЗ для агентов

> **Полный аудит от 13.10.2026** (повторная верификация кода).
> Метод: чтение всего исходного кода + **фактические сборки**.
> Этот файл — актуальное ТЗ. Старый `TECH_TASKS.md` — исторический артефакт.
> Приоритеты: 🔴 P0 (блокер/неверные данные), 🟠 P1 (важно), 🟡 P2 (качество), ⚪ P3 (долг).

---

## 0. Статус проверки (факты, не заявления)

> **⚠️ Таблица ниже — исходный аудит 13.10.2026 (до починки). Актуальные результаты
> после выполнения волн 1–5 и 7: `tsc`=0, `build` backend/frontend=0, `lint`=0 (оба),
> `npm test`=9/9, `npm audit --omit=dev` backend=0. См. `docs/CURRENT_STATE.md`.**

| Проверка | Команда | Результат (исходно) |
|---|---|---|
| Backend типы | `npx tsc --noEmit` (backend) | ✅ exit 0 |
| Backend сборка | `npm run build` (backend) | ✅ exit 0, `dist/` создан |
| Frontend сборка | `npm run build` (frontend) | ✅ exit 0, 10 lazy-чанков |
| Backend-аудит зависимостей | `npm audit` | ❌ 35 (high 30, moderate 5) |
| Frontend-аудит зависимостей | `npm audit` | ❌ 61 (critical 2, high 35, moderate 20, low 4) |
| Конфиги ESLint/Jest | поиск файлов | ❌ отсутствуют (скрипты `lint`/`test` нерабочие) |
| Тесты | поиск `*.spec.ts`/`*.test.ts` | ❌ отсутствуют |

**Реально работает (проверено по коду):** подключён `authMiddleware` на `/api/*` кроме `/auth`; `register` всегда `USER`; проверяется `isActive`; refresh-токен помечен `type:'refresh'` и не проходит в API; глобальный error-handler + 404 + маппинг `CastError→400`, `ValidationError→400`, дубль→`409`; `runValidators` в `findByIdAndUpdate`; DELETE-роуты у всех сущностей; seed корректно парсит CSV (шапка по содержимому, `dd.mm.yyyy`, `5 760,00 ₽`, пропуск `invoiceRef`), идемпотентен, создаёт `admin/admin123`.

---

## 1. 🔴 P0 — Неверная бизнес-логика и блокеры эксплуатации

### T-1.1. Исправить расчёт расхода в ОДР
- **Агент:** Backend
- **Файлы:** `backend/src/services/odr.service.ts`
- **Проблема:** расход = `$sum: '$priceWithVat'` — **без умножения на `quantity`** (занижение в разы); фильтр `status: { $ne: '⏳ Ожидает' }` включает отменённые; заявки с заполненным `invoiceRef` считаются **вместе** со счетами (двойной учёт). Расхождение с `docs/ODR_LOGIC.md`.
- **Шаги:**
  1. Расход по заявкам: `priceWithVat * quantity`.
  2. Учитывать только статусы «Заказано/Получено/Оплачено» (см. `frontend/src/app/core/constants.ts` — согласовать строки статусов).
  3. Исключать заявки, покрытые счётом (`invoiceRef` заполнен).
  4. Добавить агрегацию дохода из «Прочих поступлений» (см. T-1.4).
- **Приёмка:** контрольный пример по CSV за период совпадает с ручным пересчётом; есть unit-тест `odr.service`.
- **Проверка:** `npx tsc --noEmit` + тест сервиса.

### T-1.2. ОДР: «Прочие поступления»
- **Агент:** Backend (+Frontend)
- **Файлы:** новая `models/AdditionalIncome.ts`, `services/odr.service.ts`, роуты/контроллер, UI `/reports/odr`.
- **Контекст:** `ODR_LOGIC.md` требует ручной ввод поступлений, не связанных со счётом, с выбором категории.
- **Приёмка:** CRUD поступлений; попадают в `totalIncome`.

### T-1.3. Убрать хардкод адреса API (`http://localhost:3000`)
- **Агент:** Frontend / DevOps
- **Файлы:** `frontend/src/app/core/api.ts` (единственный источник — уже хорошо), `angular.json`, `frontend/nginx.conf`
- **Проблема:** SPA жёстко стучит на `http://localhost:3000`. В контейнере откроется только при заходе с той же машины (`localhost` = машина клиента). nginx уже проксирует `/api/`, но фронт им не пользуется.
- **Шаги:** в prod-сборке `API_URL = ''` (относительные пути `/api/...`); dev — через `environment.ts`/`fileReplacements`. nginx-прокси уже готов.
- **Приёмка:** `docker compose up` + доступ к `http://<ip-хоста>:4200` → логин и данные работают (не только localhost).

### T-1.4. Автоматический seed при `docker compose up`
- **Агент:** DevOps/Backend
- **Файлы:** `docker-compose.yml`, `backend/Dockerfile`
- **Проблема:** чистое окружение поднимается **без пользователей** → войти невозможно. Сейчас seed запускают руками.
- **Шаги:** one-shot сервис `seed` (depends_on mongodb healthy) или entrypoint-флаг `RUN_SEED=1`. Идемпотентность уже есть.
- **Приёмка:** `docker compose up` на пустом volume → `admin/admin123` логинится.

---

## 2. 🟠 P1 — Безопасность

### T-2.1. Полноценный refresh-flow
- **Агент:** Backend + Frontend
- **Файлы:** `services/auth.service.ts`, `middleware/auth.middleware.ts`, `routes/auth.ts`, `frontend/src/app/core/auth.interceptor.ts`, `auth.service.ts`
- **Проблема:** `generateRefreshToken` создаёт токен, но эндпоинта `POST /api/auth/refresh` **нет**; отдельного `REFRESH_SECRET` нет (общий секрет); фронт хранит refresh, но никогда не обновляет → через 15 мин молча 401.
- **Шаги:** `REFRESH_SECRET` в `config/env.ts`; `POST /api/auth/refresh` (принимает refresh, отдаёт новую пару); интерцептор: на 401 — попытка refresh один раз, затем выход.
- **Приёмка:** после истечения access сессия продлевается без перелогина; refresh нельзя использовать как access.

### T-2.2. Закрыть публичную регистрацию + управление пользователями
- **Агент:** Backend
- **Файлы:** `routes/auth.ts`, новый `routes/users.ts`, `controllers/user.controller.ts`, `services/user.service.ts`, `middleware/auth.middleware.ts` (`roleMiddleware` уже есть, но **не используется**).
- **Проблема:** `POST /api/auth/register` открыт всем → любой создаёт `USER` (спам/шум). `roleMiddleware` мёртвый код.
- **Шаги:** `/api/auth/register` → только `ADMIN` (или отключить после первого админа); CRUD `/api/users` под `roleMiddleware(['ADMIN'])`; нельзя деактивировать/понижать последнего админа.
- **Приёмка:** без ADMIN-токена `/api/users` → 403; роль из тела не принимается.

### T-2.3. CORS whitelist + rate-limit
- **Агент:** Backend
- **Файлы:** `server.ts`, `package.json`
- **Проблема:** `app.use(cors())` пускает любой origin; нет защиты `/login` от перебора.
- **Шаги:** `cors({ origin: env.corsOrigins, credentials: true })`; `express-rate-limit` на `/api/auth/login`.
- **Приёмка:** посторонний origin не проходит; >N попыток логина → 429.

### T-2.4. Обновить зависимости по `npm audit`
- **Агент:** DevOps
- **Файлы:** `backend/package.json`, `frontend/package.json`
- **Данные:** backend 35 (30 high); frontend 61 (2 critical, 35 high).
- **Приёмка:** обе сборки и обе сборки-бандлы проходят после обновления; количество уязвимостей заметно снижено.

### T-2.5. Валидация входных данных (DTO)
- **Агент:** Backend
- **Файлы:** контроллеры, `class-validator` (уже в зависимостях, но **не используется**).
- **Проблема:** тело запроса не валидируется, кроме ad-hoc проверок в auth. `Requisition`/`Invoice`/`Order` принимают произвольные поля.
- **Приёмка:** некорректный payload → 400 с понятным сообщением.

---

## 3. 🟠 P1 — Данные и seed

### T-3.1. Импортировать `db_spotninyg - products.csv`
- **Агент:** Data/Seed
- **Файлы:** `backend/scripts/seed.ts`
- **Проблема:** файл (288 позиций, 13 колонок) **не импортируется нигде**, хотя это основной каталог номенклатуры (Артикул_Поставщика, Внутренний_SKU, Категория, Бренд, Поставщик, Цена `80 000,00 ₽`, …).
- **Шаги:** парсер уже есть (`parseNumber`); заливать в справочник категорий/брендов/поставщиков и/или отдельную модель номенклатуры; связать с заявками по SKU.
- **Приёмка:** >0 записей импортировано, видны в UI.

### T-3.2. Согласовать путь к данным (.env ↔ git ↔ seed)
- **Агент:** Data/Seed / DevOps
- **Файлы:** `backend/scripts/seed.ts:18`, `.env`, `.env.example`, расположение CSV
- **Проблема:** три источника расходятся:
  - seed default — `D:/ОДР/данные для заполнения на сайте` (чужой путь);
  - `.env` `SEED_DATA_DIR=…/данные для заполнения на сайте/data`;
  - в git CSV лежат в корне папки, а не в `data/` (в рабочем дереве файлы перемещены в `data/`).
- **Шаги:** единый относительный путь к выгрузкам; при отсутствии `SEED_DATA_DIR` — падать с явной ошибкой, а не молча заливать 0 записей.
- **Приёмка:** свежий клон + `npm run seed` находит файлы; отсутствие данных → понятная ошибка.

### T-3.3. Дубли и целостность seed
- **Агент:** Data/Seed
- **Проблема:** справочники `Suppliers/Customers` берутся из `Снабжение.csv`, но категории заявок (`Оборудование`, …) не добавляются в `Types`; `products.csv` категории не попадают.
- **Приёмка:** в `Types` есть все категории, встречающиеся в заявках/каталоге.

---

## 4. 🟡 P2 — Frontend: качество и функции

### T-4.1. Сервисный слой вместо `HttpClient` в компонентах
- **Агент:** Frontend
- **Файлы:** новый `frontend/src/app/core/api/*.service.ts`; сейчас `HttpClient` инжектится прямо в **5** компонентов.
- **Приёмка:** компоненты не знают про `API_URL`/`HttpClient`.
- **Примечание:** `takeUntilDestroyed` уже применён — утечек нет.

### T-4.2. Единые типы/интерфейсы, убрать `any`
- **Агент:** Frontend + Backend
- **Проблема:** интерфейсы моделей дублируются в каждом компоненте; в backend `Dictionary.meta: Record<string, any>`.
- **Приёмка:** общие модели в `core/models/`; правило TECH_STACK «никакого `any`» соблюдено.

### T-4.3. Серверная пагинация и фильтры
- **Агент:** Backend + Frontend
- **Контекст:** 147 заявок, 242 складские позиции — сейчас грузятся целиком; `search` без пагинации.
- **Приёмка:** `page`/`limit`/`sort` в API, UI-пагинация.

### T-4.4. Формы создания заказов и движений склада
- **Агент:** Frontend
- **Файлы:** `orders.component.ts` (только чтение), `warehouse.component.ts` (журнал только чтение).
- **Контекст:** backend CRUD уже поддерживает `POST /api/orders`, `POST /api/warehouse`.
- **Приёмка:** создание заказа (спецификация с позициями) и приход/расход на складе из UI.

### T-4.5. Единый механизм уведомлений и обработка 401/403
- **Агент:** Frontend
- **Проблема:** inline `error/notice` в каждом компоненте; `alert`/`confirm`; 401 глотается как «Не удалось загрузить».
- **Приёмка:** toast-сервис; 401 → авто-logout (в связке с T-2.1).

### T-4.6. Доступность icon-кнопок
- **Агент:** Frontend
- **Проблема:** кнопки ✏️/🗑️ без `aria-label`/текста.
- **Приёмка:** у всех иконочных кнопок есть `aria-label` и `title`.

### T-4.7. Определиться со стилями (Tailwind vs SCSS/CSS)
- **Агент:** Frontend/Docs
- **Проблема:** `TECH_STACK & GUIDELINES.md` заявляет TailwindCSS+SCSS и PrimeNG/Material — фактически чистый CSS (`styles.css`), UI-кит не подключён.
- **Решение:** либо подключить, либо привести доку в соответствие (рекомендуется второе — UI уже целостный).

---

## 5. 🟡 P2 — Инфраструктура, тесты, CI

### T-5.1. ESLint + Prettier (backend и frontend)
- **Проблема:** скрипты `npm run lint` есть, конфигов **нет** → команда падает.
- **Приёмка:** `npm run lint` проходит на обоих проектах.
- **Агент:** DevOps/Backend/Frontend.

### T-5.2. Smoke-тесты
- **Агент:** QA/Backend
- **Проблема:** `jest` в зависимостях, тестов нет.
- **Приёмка:** тесты `GET /health`, `POST /api/auth/login`, `GET /api/requisitions` (с токеном/без), `odr.service` (unit). `npm test` зелёный.

### T-5.3. Health-check БД
- **Агент:** Backend
- **Файл:** `server.ts:28`
- **Проблема:** `/health` не отражает `mongoose.connection.readyState`.
- **Приёмка:** при отключённой БД `/health` → 503.

### T-5.4. CI (GitHub Actions)
- **Агент:** DevOps
- **Приёмка:** на push/PR — install + `tsc` + `build` (backend, frontend) + `test` + `lint`.

### T-5.5. Production-конфиг Angular
- **Агент:** Frontend
- **Приёмка:** `environment.prod.ts` + `fileReplacements` в `angular.json` (связано с T-1.3).

---

## 6. ⚪ P3 — Архитектурный долг (из `DOMAIN_MAP` / `TECH_STACK`)

> **Статус (13.10.2026):** T-6.1/6.2/6.3/6.4/6.5/6.6 — ✅ **все выполнены**.

- **T-6.1.** ✅ ВЫПОЛНЕНО. Tenant isolation: `organizationId` (default `default-org`) во всех моделях
  документов + `User`; JWT содержит organizationId (fallback для старых токенов — без перелогина);
  сервисы скоупят списки/агрегации; клиент не может задать org в теле (не в allow-листе); seed
  назначает org всем записям. Тесты `tests/tenancy.test.ts`.
- **T-6.2.** ✅ ВЫПОЛНЕНО. Snapshotting: модель `RequisitionSnapshot` (копия ключевых полей +
  `lineTotal` + `previousStatus`), создаётся при фактической смене статуса в
  `requisition.controller.update`; **неизменяемость** — update/delete-эндпоинтов нет + запрет на
  уровне Mongoose (pre-хуки). `GET /api/requisitions/:id/snapshots`. Тесты `tests/snapshots.test.ts`.
- **T-6.3.** ✅ ВЫПОЛНЕНО. Audit log: модель `AuditLog` + `audit.service.ts` (никогда не бросает
  исключений — ошибка аудита не ломает операцию); запись на уровне контроллеров по 8 сущностям
  (requisitions, invoices, orders, dictionaries, stockItems, products, additionalIncomes, users);
  `GET /api/audit-logs` — только ADMIN, фильтры + пагинация. Тесты `tests/audit.test.ts`.
- **T-6.4.** ✅ ВЫПОЛНЕНО. OpenAPI 3.0: `backend/src/config/openapi.ts` + `backend/src/routes/docs.ts`;
  `GET /api/openapi.json` (спека) и `GET /api/docs` (Swagger UI, CDN) — без токена; тест `tests/docs.test.ts`.
- **T-6.5.** ✅ ВЫПОЛНЕНО. `docs/pages/<name>.page.md` для каждого экрана (`README` + login, shell,
  requisitions, orders, invoices, warehouse, catalog, dictionaries, odr).
- **T-6.6.** ✅ ВЫПОЛНЕНО. Индексы: добавлены requisitions `{customer: 1}`, auditLogs `{createdAt: -1}`
  и `{entityType: 1, createdAt: -1}`, snapshots `{requisitionId: 1}` (уже существовавшие не дублировались).

### Сопутствующая задача: апгрейд Angular (следствие T-2.4)
- **Статус:** ✅ ВЫПОЛНЕНО (13.10.2026). Angular 17.3.12 → **22.2.2** поэтапным `ng update`
  (17→18→19→20→21→22 + миграция `use-application-builder`).
- **Итог:** builder `@angular/build:application`, TypeScript ~6.0.3, zone.js 0.15.1 (zone-based CD
  сохранён), ESLint 10 flat config + typescript-eslint 8, Dockerfile → `node:22-alpine`.
- **Результат audit:** 66 уязвимостей (2 critical XSS в `@angular/core`) → **0** (и prod, и dev).
- **Проверки:** `npm run build` ✅, `npm run lint` ✅ (0 сообщений), `npm audit` ✅ (0).

---

## 7. 🟡 P2 — Документация (противоречия)

- **T-7.1.** `docs/CURRENT_STATE.md` — раздел «Ключевые проблемы» описывает давно закрытые баги как открытые; обновить.
- **T-7.2.** `docs/tasks/TODO_CHECKLIST.md` — **два** взаимоисключающих блока «Не начато»; первый утверждает, что backend/seed/Docker готовы, второй — что нет. Убрать дубли.
- **T-7.3.** `README.md` — «Всё в Docker (требует Dockerfile — задача 1.2/1.3)», хотя Dockerfile уже есть; и «⚠️ Порядок ниже — целевой» устарело.
- **T-7.4.** `docs/TECH_STACK & GUIDELINES.md` — опечатка «Си хочет-тоны» (Signals); заявлены несуществующие Tailwind/PrimeNG/Material.
- **T-7.5.** `ROADMAP.md` — все чекбоксы пустые при фактически выполненном Этапе 1.

---

## 8. Рекомендуемый порядок и распараллеливание

| Волна | Задачи (параллельно по агентам) |
|---|---|
| **1 (P0)** | `Backend`: T-1.1, T-1.2 · `Frontend`: T-1.3 · `DevOps`: T-1.4 |
| **2 (P1 Security)** | `Backend`: T-2.1, T-2.2, T-2.3, T-2.5 · `Frontend`: часть T-2.1 · `DevOps`: T-2.4 |
| **3 (P1 Data)** | `Data`: T-3.1, T-3.2, T-3.3 |
| **4 (P2 Frontend)** | `Frontend`: T-4.1…T-4.7 |
| **5 (P2 Infra)** | `DevOps`: T-5.1, T-5.4, T-5.5 · `QA`: T-5.2 · `Backend`: T-5.3 |
| **6** | `Docs`: T-7.x · `Backend`: T-6.x по мере приоритета |

---

## 9. Правила для агентов

> Готовые промпты по задачам и процедура проверки — **[`AGENT_PROMPTS.md`](AGENT_PROMPTS.md)**.

1. Перед PR: `npx tsc --noEmit` / `npm run build` (оба проекта) — **0 ошибок**.
2. Не менять публичные контракты API без отметки в задаче; согласовывать frontend↔backend.
3. Русские комментарии только для неочевидной логики (особенно ОДР); без лишних комментариев.
4. Не коммитить `.env`/секреты; `.gitignore` уже настроен.
5. Каждая задача T-x.y = один PR; в описании — ссылка на пункт этого файла и результат проверки.

*Источник: полное чтение `backend/src`, `backend/scripts`, `frontend/src`, конфигов и выгрузок + фактические сборки. Дата: 13.10.2026.*
