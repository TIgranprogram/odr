# TODO CHECKLIST

> ⚠️ **Пересмотрено 13.10.2026 по итогам полного аудита кода.**
> Ранее этот файл помечал как сделанное то, чего в репозитории нет
> (TailwindCSS, Layout, Pino, валидация пароля, защищённые роуты).
> Ниже — фактическое состояние. Детальные задачи: **`docs/tasks/TECH_TASKS.md`**.

## 🏁 Текущий статус: аудит завершён, начата починка

### ✅ Выполнено
- [x] Git-репозиторий + SSH-ключ + push на GitHub (`TIgranprogram/odr`, ветка `main`)
- [x] `.gitignore` создан, `.env` исключён из коммитов
- [x] Документация: ROADMAP, DOMAIN_MAP, ODR_LOGIC, TECH_STACK, CURRENT_STATE
- [x] Frontend: восстановлена инфраструктура сборки (`angular.json`, `tsconfig*.json`,
      `src/index.html`, `src/main.ts`, `src/styles.css`) — **раньше отсутствовала целиком**
- [x] Frontend: зависимости установлены (805 пакетов)
- [x] Frontend: оболочка приложения — `AppComponent`, layout с sidebar/header
      (`shell.component.ts`), вложенные маршруты, `authGuard`, JWT-интерцептор
- [x] Frontend: реальный логин (`POST /api/auth/login`, сохранение токена, редирект)
- [x] Frontend: все страницы переписаны — заявки (CRUD + поиск + фильтры), заказы,
      счета (создание с позициями), справочники (CRUD + категории из seed),
      склад (остатки + журнал движений), ОДР (выбор периода)
- [x] Frontend: `ng build` проходит без ошибок (10 ленивых чанков)
- [x] Frontend: `Dockerfile` + `nginx.conf` созданы
- [x] Backend: исправлена версия `class-validator` (несуществующая `0.18.0` → `0.14.1`)
- [x] Backend: зависимости установлены
- [x] Docker Desktop установлен и запущен (сервер 29.8.2, Compose v5.6.0)
- [x] MongoDB-контейнер `odr-mongo` запущен (порт 27017)
- [x] `docker-compose.yml` переписан (mongodb + backend + frontend, healthcheck, volume)
- [x] Backend: компиляция — все 7 блокеров закрыты, `tsc` — 0 ошибок
- [x] Backend: auth подключён, register безопасен, refresh-токен защищён
- [x] Backend: глобальный error-handler, 404-catch-all, `runValidators`, DELETE-роуты
- [x] Backend: seed переписан и проверен — 41 словарь, 242 складские позиции,
      147 заявок, создан админ `admin/admin123`, повторный запуск идемпотентен
- [x] Backend: `Dockerfile` создан
- [x] API проверен end-to-end: health 200, login 200, без токена 401, битые даты 400

### ⏳ В работе / осталось

> Детально и по агентам — **`docs/tasks/AGENT_TASKS.md`**.

- [x] 🔴 ОДР: расход без `quantity`, фильтр статусов, двойной учёт по `invoiceRef` (T-1.1)
- [x] 🔴 ОДР: «Прочие поступления» — backend + UI `/reports/odr` (T-1.2)
- [x] 🔴 Prod API-URL вместо `http://localhost:3000` (T-1.3)
- [x] 🔴 Автосев при `docker compose up` (T-1.4)
- [x] 🟠 Эндпоинт `/auth/refresh` + refresh-интерцептор (T-2.1)
- [x] 🟠 Закрыть публичную регистрацию + `/api/users` + roleMiddleware (T-2.2)
- [x] 🟠 CORS whitelist + rate-limit на `/login` (T-2.3)
- [x] 🟠 Обновить зависимости по `npm audit` (T-2.4) — backend prod: 0; frontend: 0 (после апгрейда Angular)
- [x] 🟠 DTO-валидация входных данных (T-2.5, через `utils/validate.ts`)
- [x] 🟠 Импорт `products.csv` — каталог, 288 позиций (T-3.1)
- [x] 🟠 Единый путь к данным seed + fail-fast (T-3.2)
- [x] 🟠 Категории из CSV → `Types` (T-3.3)
- [x] 🟡 Сервисный слой frontend, общие модели, пагинация (T-4.1–T-4.6)
- [x] 🟡 ESLint/Prettier, smoke-тесты, health-check БД, CI (T-5.1–T-5.5)
- [x] ⚪ Tenant isolation, snapshotting, audit-log, индексы (T-6.1/6.2/6.3/6.6) — выполнено (тесты 25/25)
- [x] ⚪ Swagger/OpenAPI (T-6.4) — `/api/docs` + `/api/openapi.json`
- [x] ⚪ `docs/pages/*.page.md` для каждого экрана (T-6.5)
- [x] 🟠 Апгрейд Angular 17.3 → 22.2.2 (следствие T-2.4) — audit 66 → 0
- [x] 🟡 Документация: устранены противоречия (T-7.x); `docs/pages/*.page.md` — остаётся (T-6.5)

---

## 📋 Волны работ

| Волна | Фокус | Задачи |
|---|---|---|
| **1 (P0)** | Данные + эксплуатация | T-1.1, T-1.2, T-1.3, T-1.4 |
| **2 (P1)** | Безопасность | T-2.1…T-2.5 |
| **3 (P1)** | Данные/seed | T-3.1…T-3.3 |
| **4 (P2)** | Frontend | T-4.1…T-4.7 |
| **5 (P2)** | Инфра/тесты/CI | T-5.1…T-5.5 |
| **6** | Долг и документация | T-6.x, T-7.x |

---
*Статус обновления: 13.10.2026 — повторный аудит с фактическими сборками; актуальное ТЗ — `AGENT_TASKS.md`.*
