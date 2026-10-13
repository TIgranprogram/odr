# AGENT_PROMPTS — Промпты агентов и план проверки

> Организация работы по ТЗ [`AGENT_TASKS.md`](AGENT_TASKS.md).
> Документ для оркестратора: копируй готовый промпт в агента нужной роли,
> затем проверяй результат по разделу **«3. Проверка»**.

---

## 1. Как организовать работу (оркестрация)

**Роли:** `backend`, `frontend`, `data`, `devops`, `qa`, `docs`, `verifier` (проверяющий).

**Правила:**
1. **1 задача = 1 ветка = 1 PR.** Имя ветки: `task/<id>-<slug>` (напр. `task/1.1-odr-expense`).
2. Ветка создаётся от актуального `main`; перед PR — `git fetch` и ребейз.
3. Агент **обязан приложить вывод команд самопроверки** (см. §2.0).
4. `verifier` проверяет PR по чек-листу §3. **Merge только после зелёной проверки.**
5. Параллельно можно запускать только задачи одной волны (см. `AGENT_TASKS.md` §8); пересекающиеся файлы — последовательно.
6. Секреты и `.env` не коммитить. Не менять чужие задачи без согласования.

**Зависимости:**
```
T-1.3 (prod URL) ──▶ T-5.5 (env Angular)
T-1.1 ──▶ T-1.2 (ОДР: сначала формула, потом доп. поступления)
T-2.1 (refresh backend) ──▶ interceptor-часть T-2.1 (frontend) ──▶ T-4.5 (обработка 401)
T-5.2 (тесты) зависит от T-1.1 (тест на odr.service)
```

---

## 2. Промпты

### 2.0 Универсальный шаблон (для любого агента)

```text
Ты — <role>-агент проекта ODR. Рабочая папка: D:\invSportiN\Сайт\odr.
Стек: Express+TypeScript+Mongoose (backend), Angular 17 standalone (frontend),
MongoDB 7, Docker. npm запускать через: cmd /c "npm ...".

КОНТЕКСТ: прочитай docs/tasks/AGENT_TASKS.md (задача <T-x.y>) и указанные там файлы.
ЗАДАЧА: <дословно из AGENT_TASKS>.
ОГРАНИЧЕНИЯ: не менять публичные контракты API без отметки; русские комментарии
только для неочевидной логики; без лишних комментариев; не коммитить секреты/.env;
работать в ветке task/<id>-<slug>.

САМОПРОВЕРКА (запусти и приложи вывод, exit code 0 обязателен):
  backend:  cmd /c "npx tsc --noEmit"  и  cmd /c "npm run build"
  frontend: cmd /c "npm run build"
  при наличии тестов/линтера: cmd /c "npm test"  /  cmd /c "npm run lint"

ФОРМАТ ОТВЕТА (строго):
  1. Изменённые файлы (пути).
  2. Что сделано по шагам задачи.
  3. Вывод команд самопроверки (команда → результат).
  4. Риски / что осталось / с чем может конфликтовать.
```

---

### 2.1 P0 — Backend / Frontend / DevOps

**T-1.1 — исправить расход в ОДР (backend)**
```text
Ты — backend-агент ODR. Ветка task/1.1-odr-expense.
ЧИТАЙ: docs/tasks/AGENT_TASKS.md → T-1.1; docs/ODR_LOGIC.md; docs/DOMAIN_MAP.md.
ЗАДАЧА: в backend/src/services/odr.service.ts исправить расчёт РАСХОДА:
  1) сумма = priceWithVat * quantity (сейчас без quantity — занижено);
  2) учитывать только статусы «Заказано/Получено/Оплачено» (см. STATUSES в
     frontend/src/app/core/constants.ts — согласовать строки), не включать «Отменено»;
  3) исключать заявки с заполненным invoiceRef (двойной учёт со счётом);
  4) структуру отчёта и тип OdrReport сохранить совместимыми.
ДОБАВЬ unit-тест backend/src/services/odr.service.spec.ts на контрольном наборе.
САМОПРОВЕРКА: cmd /c "npx tsc --noEmit"; cmd /c "npm run build"; cmd /c "npm test".
ПРИЁМКА: тест подтверждает расход с quantity, без отменённых, без invoiceRef.
```

**T-1.2 — «Прочие поступления» в ОДР (backend + frontend)**
```text
Ты — backend-агент ODR. Ветка task/1.2-other-income.
ЧИТАЙ: docs/tasks/AGENT_TASKS.md → T-1.2; docs/ODR_LOGIC.md (раздел «Доп. поступления»).
ЗАДАЧА: добавить модель AdditionalIncome (дата, сумма, категория, примечание),
сервис/контроллер/роуты CRUD /api/additional-incomes (под authMiddleware),
и учитывать их в totalIncome в odr.service.getReport за период.
САМОПРОВЕРКА: cmd /c "npx tsc --noEmit"; cmd /c "npm run build".
ПРИЁМКА: POST → запись; попадает в доход отчёта за период.
ОТДЕЛЬНЫЙ PR для UI — см. T-1.2-frontend (форма на /reports/odr).
```

**T-1.3 — prod API URL (frontend)**
```text
Ты — frontend/DevOps-агент ODR. Ветка task/1.3-api-url.
ЧИТАЙ: docs/tasks/AGENT_TASKS.md → T-1.3; frontend/src/app/core/api.ts; frontend/nginx.conf.
ЗАДАЧА: убрать жёсткий http://localhost:3000. В dev использовать environment.ts,
в prod — относительный путь (API_URL=''), т.к. nginx уже проксирует /api/ на backend.
Настроить fileReplacements в frontend/angular.json.
САМОПРОВЕРКА: cmd /c "npm run build"; проверить, что в бандле нет "localhost:3000".
ПРИЁМКА: в prod-сборке запросы идут на /api/... (не на localhost).
```

**T-1.4 — автосев при docker compose up (devops/backend)**
```text
Ты — DevOps-агент ODR. Ветка task/1.4-docker-seed.
ЧИТАЙ: docs/tasks/AGENT_TASKS.md → T-1.4; docker-compose.yml; backend/Dockerfile; backend/scripts/seed.ts.
ЗАДАЧА: чистое окружение должно иметь админа после `docker compose up`.
Сделай one-shot сервис seed (depends_on mongodb healthy) ИЛИ вход по флагу RUN_SEED.
Seed уже идемпотентен (повторный запуск не плодит дубли) — не ломать это.
САМОПРОВЕРКА: docker compose down -v; docker compose up -d --build; подождать;
  curl http://localhost:3000/health → ok; логин admin/admin123 → 200.
ПРИЁМКА: на пустом volume логин работает.
```

---

### 2.2 P1 — Безопасность

**T-2.1 — refresh-flow (backend + frontend)**
```text
Ты — backend-агент ODR (потом frontend-агент тем же PR или цепочкой). Ветка task/2.1-refresh.
ЧИТАЙ: docs/tasks/AGENT_TASKS.md → T-2.1; backend/src/services/auth.service.ts;
backend/src/config/env.ts; backend/src/routes/auth.ts; frontend/src/app/core/auth.interceptor.ts.
ЗАДАЧА backend: отдельный env.refreshSecret; POST /api/auth/refresh принимает refresh-токен,
проверяет type==='refresh', отдаёт новую пару access+refresh; access по-прежнему НЕ принимает refresh.
ЗАДАЧА frontend: HTTP-интерцептор при 401 делает одну попытку refresh и повторяет запрос,
иначе logout. Хранить обновлённые токены.
САМОПРОВЕРКА: tsc/build backend; build frontend; ручной сценарий: истёкший access → запрос уходит после refresh.
ПРИЁМКА: refresh нельзя использовать как access; сессия продлевается без перелогина.
```

**T-2.2 — закрыть регистрацию + управление пользователями (backend)**
```text
Ты — backend-агент ODR. Ветка task/2.2-users.
ЧИТАЙ: docs/tasks/AGENT_TASKS.md → T-2.2; middleware/auth.middleware.ts (roleMiddleware уже есть).
ЗАДАЧА: POST /api/auth/register доступен только ADMIN (или отключить после первого админа);
добавить CRUD /api/users под authMiddleware+roleMiddleware(['ADMIN']); запретить
деактивацию/понижение последнего ADMIN; не отдавать хэши паролей.
САМОПРОВЕРКА: tsc/build; ручные запросы: без токена → 401; не-ADMIN → 403; ADMIN → 200.
ПРИЁМКА: роль из тела не принимается; список/создание/блокировка только для ADMIN.
```

**T-2.3 — CORS whitelist + rate-limit (backend)**
```text
Ты — backend-агент ODR. Ветка task/2.3-cors-ratelimit.
ЧИТАЙ: docs/tasks/AGENT_TASKS.md → T-2.3; backend/src/server.ts; backend/src/config/env.ts.
ЗАДАЧА: cors({ origin: env.corsOrigins, credentials: true }) со списком из env;
подключить express-rate-limit на /api/auth/login (напр. 10 попыток/15 мин).
САМОПРОВЕРКА: tsc/build; запрос с чужого Origin не проходит; >N логинов → 429.
ПРИЁМКА: origin ограничен, brute-force ограничен.
```

**T-2.4 — обновление зависимостей (devops)**
```text
Ты — DevOps-агент ODR. Ветка task/2.4-deps.
ЗАДАЧА: снизить npm audit (backend 35/30 high; frontend 61/2 critical/35 high).
Обновляй осторожно; после каждого шага — сборки. Не ломать Angular 17 и Express 4.
САМОПРОВЕРКА: npm audit (числа до/после); tsc/build backend; build frontend.
ПРИЁМКА: обе сборки зелёные, уязвимостей меньше; в отчёте — список критичных.
```

**T-2.5 — DTO-валидация (backend)**
```text
Ты — backend-агент ODR. Ветка task/2.5-validation.
ЗАДАЧА: подключить class-validator (уже в deps) для входных данных контроллеров
(Requisition/Invoice/Order/AdditionalIncome/Dictionary). Некорректный payload → 400 JSON.
САМОПРОВЕРКА: tsc/build; negative-тесты (пустые/битые поля → 400).
ПРИЁМКА: произвольные поля не сохраняются; ошибки понятные.
```

---

### 2.3 P1/P2 — Data, Frontend, Infra, Docs

**T-3.1 — импорт products.csv (data)** · **T-3.2 — единый путь к данным (data/devops)** · **T-3.3 — категории в Types (data)**
```text
Ты — data-агент ODR. Ветка task/3.x-<slug>.
ЧИТАЙ: docs/tasks/AGENT_TASKS.md → T-3.1/T-3.2/T-3.3; backend/scripts/seed.ts.
ЗАДАЧА: см. соответствующую T-задачу (products.csv 288 позиций; согласовать SEED_DATA_DIR;
добавить в Types все категории из заявок и каталога).
САМОПРОВЕРКА: cmd /c "npm run seed" → без ошибок; повторный запуск не плодит дубли;
проверить counts через mongo/mongosh.
ПРИЁМКА: >0 записей каталога, все категории, идемпотентность.
```

**T-4.x — frontend (frontend-агент, по одной задаче на PR)**
```text
Ты — frontend-агент ODR. Ветка task/4.x-<slug>.
ЧИТАЙ: docs/tasks/AGENT_TASKS.md → T-4.x; соответствующие компоненты frontend/src/app/features.
ЗАДАЧА: <дословно> (сервисный слой core/api; общие модели без any; серверная пагинация;
формы заказов/движений склада; toast-уведомления и обработка 401/403; aria-label; стили).
ОГРАНИЧЕНИЯ: сохранить существующий UI-стиль (styles.css), не подключать новый UI-кит без решения.
САМОПРОВЕРКА: cmd /c "npm run build" (0 ошибок).
ПРИЁМКА: соответствующая страница работает; ошибки видны пользователю.
```

**T-5.1/T-5.4/T-5.5 — линтер, CI, prod-конфиг (devops)** · **T-5.2 — тесты (qa)** · **T-5.3 — health БД (backend)**
```text
Ты — <devops|qa|backend>-агент ODR. Ветка task/5.x-<slug>.
ЧИТАЙ: docs/tasks/AGENT_TASKS.md → T-5.x.
ЗАДАЧА: <дословно>.
САМОПРОВЕРКА: backend — tsc/build/test/lint; frontend — build/lint; для CI — прогон workflow локально.
ПРИЁМКА: npm run lint/test проходят; /health отражает readyState (503 при обрыве БД);
CI зелёный на push/PR.
```

**T-7.x — документация (docs)**
```text
Ты — docs-агент ODR. Ветка task/7.x-docs.
ЗАДАЧА: устранить противоречия в README/CURRENT_STATE/TODO_CHECKLIST/TECH_STACK/ROADMAP
(см. AGENT_TASKS §7), добавить docs/pages/<name>.page.md по шаблону.
САМОПРОВЕРКА: сверяй утверждения только с фактами кода и сборок; ссылки в README валидны.
ПРИЁМКА: нет утверждений, противоречащих реальности.
```

---

## 3. Проверка (Verifier)

### 3.0 Промпт проверяющего агента

```text
Ты — verifier-агент ODR. Не пиши код, только проверяй.
ВХОД: PR/ветка task/<id>-<slug> и задача <T-x.y> из docs/tasks/AGENT_TASKS.md.
СДЕЛАЙ:
  1) review diff: соответствие задаче T-x.y, нет ли изменений вне scope.
  2) воспроизведи сборки на ветке:
       backend:  cmd /c "npx tsc --noEmit"  (ожидание: exit 0)
                 cmd /c "npm run build"      (ожидание: exit 0)
       frontend: cmd /c "npm run build"      (ожидание: exit 0)
       при наличии: cmd /c "npm test" / cmd /c "npm run lint" (ожидание: зелёный)
  3) прогони функциональный чек-лист задачи (см. таблицу §3.2).
  4) проверь регрессии затрагиваемых мест (см. §3.3).
  5) проверь определение готовности §3.1.
ВЫДАЙ: PASS/FAIL по каждому пункту, точные команды и вывод, список замечаний,
вердикт: MERGE / CHANGES REQUESTED (с причинами).
```

### 3.1 Определение готовности (DoD) — для любого PR

- [ ] Реализованы **все** шаги задачи, ничего лишнего.
- [ ] `tsc --noEmit` и `npm run build` (backend) → 0 ошибок; `npm run build` (frontend) → 0 ошибок.
- [ ] Тесты/линтер, если задача их добавляет, — зелёные.
- [ ] Приёмка задачи выполнена (см. §3.2).
- [ ] Нет секретов/`.env` в diff.
- [ ] Ветка актуальна относительно `main`, конфликтов нет.
- [ ] Публичный контракт API, если менялся, задокументирован.

### 3.2 Матрица функциональной проверки по задачам

| Задача | Как проверить | Ожидание |
|---|---|---|
| T-1.1 | unit-тест `odr.service.spec.ts` + ручной пересчёт по CSV за период | расход = Σ(price·qty) по нужным статусам, без `invoiceRef` |
| T-1.2 | `POST /api/additional-incomes` → `GET /api/odr?start=&end=` | сумма входит в `totalIncome` |
| T-1.3 | `npm run build` frontend; grep бандла | нет `localhost:3000`; запросы на `/api/...` |
| T-1.4 | `docker compose down -v && up -d --build`; логин | `admin/admin123` → 200 на пустом volume |
| T-2.1 | истёкший access → запрос; refresh как access | продление без перелогина; refresh→401 в API |
| T-2.2 | `/api/users` без токена / USER / ADMIN | 401 / 403 / 200; роль из тела игнорируется |
| T-2.3 | запрос с чужого Origin; N логинов | CORS блок; 429 |
| T-2.4 | `npm audit` до/после | меньше уязвимостей, сборки зелёные |
| T-2.5 | битый payload | 400 JSON, поля не сохранены |
| T-3.1..3.3 | `npm run seed` ×2; счётчики в Mongo | >0 каталога, идемпотентно, категории полны |
| T-4.x | build + ручной сценарий страницы | фича работает, ошибки видны |
| T-5.1 | `npm run lint` (оба проекта) | exit 0 |
| T-5.2 | `npm test` | зелёный; есть smoke-тесты |
| T-5.3 | остановить Mongo → `/health` | 503, а не 200 |
| T-5.4 | push в тестовую ветку | CI workflow зелёный |
| T-5.5 | prod build | подставляет environment.prod |
| T-7.x | ручное сравнение доков с кодом | нет ложных утверждений |

### 3.3 Обязательные регрессии (после любой задачи)

```powershell
# 1. Сборки
cmd /c "npx tsc --noEmit"   # в backend
cmd /c "npm run build"      # в backend
cmd /c "npm run build"      # в frontend

# 2. Поднять окружение
docker run -d --name odr-mongo -p 27017:27017 mongo:7   # если нет
cmd /c "npm run seed"        # в backend
cmd /c "npm run dev"         # в backend

# 3. Smoke API
curl http://localhost:3000/health                          # {"status":"ok"}
# login → 200 + токены
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" `
     -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
# без токена → 401
curl http://localhost:3000/api/requisitions
# ключевые списки → 200 с токеном: /api/requisitions, /api/invoices,
#   /api/orders, /api/warehouse, /api/stockItems, /api/dictionaries, /api/odr?start=&end=
```

### 3.4 Признаки «фальшивого» PR (отклонять)

- Меняет `AGENT_TASKS.md`/тесты вместо кода, чтобы «пройти» проверку.
- Отключает/обнуляет проверки, комментирует падающие тесты.
- Расширяет scope (рефакторит соседнее без задачи).
- Скрывает ошибки (`catch {}`), глушит 401/403.
- Коммитит `.env`, секреты, `dist/`, `node_modules/`.

---

## 4. Чек-лист оркестратора на релиз

- [ ] Все задачи волны 1 (P0) смерджены и проверены.
- [ ] Прогон §3.3 на `main` зелёный.
- [ ] Обновлён `docs/CURRENT_STATE.md` (статус + последнее действие).
- [ ] Обновлён `AGENT_TASKS.md` (отметки `[x]`, перенос в архив при необходимости).
- [ ] Тег/релиз (если требуется) и push.

*Составлено 13.10.2026 на основе аудита и `AGENT_TASKS.md`.*
