# CURRENT_STATE (Save Game)

> Это файл «сохранения» проекта. Обновляется после каждого значимого этапа,
> чтобы продолжить работу даже при потере контекста.

## 📍 Текущий статус
**Этап:** Инфраструктура и ядро подняты; актуален аудит от 13.10.2026.
**Дата:** 13.10.2026
**Ветка:** `main` → `origin/main` (GitHub: `TIgranprogram/odr`, приватность: public)

## 🔄 Последнее действие
1. Настроен SSH-доступ к GitHub (ключ `~/.ssh/odr_github`, аккаунт `TIgranprogram`).
2. `.gitignore` создан, `.env` исключён из коммитов.
3. Проведён **повторный аудит** с фактическими сборками (см. AGENT_TASKS §0).
4. Оставшиеся работы сведены в **`docs/tasks/AGENT_TASKS.md`** (актуальное ТЗ).

## ⏭️ Следующие шаги
1. 🟠 Апгрейд Angular (frontend-prod, 7 уязвимостей в `@angular/core`) — запланирован отдельной задачей.
2. ⚪ Остаточный техдолг P3 (отложено): tenant isolation, snapshot, audit-log, оптимизация Mongo (T-6.1/6.2/6.3/6.6).

## 🚨 Статус проблем (перепроверено 13.10.2026)

> Полный список задач — **`docs/tasks/AGENT_TASKS.md`**.

**✅ Закрыто (проверено фактической сборкой):**
- Backend компилируется: `npx tsc --noEmit` → 0; `npm run build` → `dist/`.
- Frontend собирается: `npm run build` → 10 lazy-чанков.
- `authMiddleware` подключён на `/api/*` (кроме `/auth`); `register` всегда `USER`;
  `isActive` проверяется; refresh-токен помечен `type:'refresh'`.
- Глобальный error-handler + 404 + маппинг CastError/ValidationError/дубль.
- Seed: парсер CSV (шапка, `dd.mm.yyyy`, `5 760,00 ₽`), идемпотентность, `admin/admin123`.
- Dockerfile × 2 + `docker-compose.yml`; DELETE-роуты; `runValidators`.
- **Волна 1 (P0), проверено end-to-end в Docker (13.10.2026):**
  - **T-1.1** ОДР: расход = `priceWithVat × quantity`, статусы `['✅ Заказать','💰 Оплачено','☑️ Получено']`,
    исключён двойной учёт по `invoiceRef`.
  - **T-1.2** ОДР: модель `AdditionalIncome` + CRUD `/api/additional-incomes`; сумма входит в `totalIncome`;
    UI на `/reports/odr` (таблица за период + форма добавить/править/удалить). Проверено через nginx: доход 0→5555→0.
  - **T-1.3** Prod API-URL: `environment.ts` (`http://localhost:3000`) / `environment.prod.ts` (`''`) + `fileReplacements`.
  - **T-1.4** Docker: one-shot сервис `seed` (depends_on mongodb healthy); API стартует после `service_completed_successfully`.
    Смонтирована папка `данные для заполнения на сайте/data` → `/data/seed`.

**❌ Осталось (главное):**
- ⚪ **Технический долг (P3, отложено):** нет tenant isolation (`organizationId`), snapshot-снимков,
  audit-log, оптимизации Mongo-запросов (T-6.1/6.2/6.3/6.6). Реализованы Swagger/OpenAPI (T-6.4)
  и `docs/pages/*.page.md` (T-6.5).
- 🟠 **`npm audit`:** production-backend — 0 уязвимостей; frontend-prod — 7 в `@angular/core`
  (требует мажорного апгрейда Angular). Dev-транзитивные предупреждения (`--force` не применялся
  во избежание поломки сборки). **Запланирована отдельная задача: поэтапный `ng update`.**

**✅ Волны 2–5 и 7 — закрыты и проверены (13.10.2026):**
- **Безопасность (T-2.x):** `/auth/refresh` + refresh-интерцептор; публичная регистрация закрыта,
  `/api/users` CRUD только ADMIN + защита последнего админа; CORS-whitelist, rate-limit на `/login`
  (10/15 мин), маппинг `ValidationError→400`/CORS→`403`; DTO-валидация через `utils/validate.ts`.
- **Данные (T-3.x):** каталог продуктов из `products.csv` — 288 позиций (`/api/products`, UI `/catalog`);
  seed: единый `resolveDataDir()` + `assertFileExists()` fail-fast; категории из CSV → `Types` (11).
- **Frontend (T-4.x):** сервисный слой (`core/services/*`) + общие модели (`core/models`), тосты
  (ToastService + компонент, 401→forceLogout, 403/сессия — уведомления), пагинация заявок
  (`GET /api/requisitions/paged`), формы заказов/движений склада, `aria-label` на иконочных кнопках.
- **Инфра/тесты (T-5.x):** ESLint+Prettier в обоих проектах (`npm run lint` — 0); Jest smoke-тесты
  (`npm test` — 7/7); `/health` → 503 при недоступной БД; GitHub Actions CI; prod-`environment` + fileReplacements.
- **Документация (T-7.x):** устранены противоречия в README / TODO_CHECKLIST / ROADMAP / TECH_STACK / CURRENT_STATE.

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
