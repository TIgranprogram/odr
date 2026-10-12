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

### ⏳ В работе (идёт починка)
- [ ] Backend: компиляция — **7 блокеров** (см. `TECH_TASKS.md` §2)
      ключевые: несуществующий `routes/orders.ts`, `dictionary.service.ts` написан
      на Python, нет `hashPassword`, нет `tsconfig.json`, `import * as Service`
      поверх `export default` → `undefined` в рантайме
      **Прогресс 13.10:** созданы `routes/orders.ts`, `tsconfig.json`, `src/config/env.ts`,
      `src/types/express.d.ts`; изменены все контроллеры/сервисы/модели. Осталось:
      дождаться верификации (`tsc --noEmit`, seed, health) и закоммитить.
- [ ] Seed: парсинг CSV сломан (шапка склада в строке 6, даты dd.mm.yyyy,
      цены с `₽`, `invoiceRef` не ObjectId) + не создаётся админ → логин невозможен
      **Прогресс 13.10:** `scripts/seed.ts` изменён — ждём проверки.

### ❌ Не начато
- [ ] Backend: `authMiddleware` не подключён ни к одному роуту → **API полностью открыт**
- [ ] Backend: `dotenv.config()` не вызывается; нет 404-catch-all и error-handler
- [ ] Backend: `Dockerfile`, `tsconfig.json`, `@types/*`
- [ ] Frontend: рабочие страницы (см. `TECH_TASKS.md` §3) — заявки, счета,
      справочники, склад, отчёты
- [ ] Frontend: `warehouse` — заглушка «Content coming soon»
- [ ] Frontend: отправка формы заявки без обязательных полей → всегда 400
- [ ] Frontend: редактирование нигде не вызывает `PUT` → создаются дубликаты
- [ ] Frontend: Dockerfile + nginx
- [ ] docker-compose up end-to-end (MongoDB + backend + frontend)
- [ ] Бизнес-логика ОДР: расход без `quantity`, двойной учёт по `invoiceRef`
      (расхождение с `docs/ODR_LOGIC.md`)
- [ ] Отчёты: экспорт в Excel/PDF
- [ ] Уведомления о критических остатках
- [ ] Линтеры, тесты, `npm audit` (61 уязвимость frontend / 35 backend)
- [ ] Документация: `docs/pages/*.page.md` (правило TECH_STACK не выполняется)

---

## 📋 Ближайший план

| День | Задачи |
|---|---|
| **13.10 (сегодня)** | ✅ Аудит, ✅ инфраструктура frontend, ⏳ починка backend + seed |
| **14.10** | Страницы frontend (§3), Dockerfile (§1), прогон end-to-end |
| **15.10** | Безопасность (§4), API-контракты (§6), бизнес-логика ОДР (§7) |
| **16.10** | Тесты, линтеры, документация (§8), финальный прогон |

---
*Статус обновления: 13.10.2026 — аудит завершён, починка в процессе.*
