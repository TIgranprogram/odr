# TECH_STACK & GUIDELINES (Технический паспорт)

## 🛠 Технологический стек
- **Frontend**: Angular 17+ (Standalone Components, Signals, Reactive Forms).
- **UI Library**: Angular Material / PrimeNG (выбрать на этапе инициализации).
- **Backend**: Node.js + Express.js + TypeScript + Mongoose.
- **Database**: MongoDB 7+.
- **Auth**: JWT (Access 15m + Refresh 7d) + Bcryptjs.
- **Styling**: TailwindCSS + SCSS.

## 📐 Архитектурные правила (Backend)
1. **Layered Architecture**:
   - `routes`: Определение эндпоинтов.
   - `controllers`: Парсинг запроса, валидация DTO, отправка ответа.
   - `services`: **Основная бизнес-логика**. Запросы к БД только через сервисы.
   - `models`: Mongoose схемы.
2. **Validation**: Использовать `class-validator` для всех входных данных (DTO).
3. **Error Handling**: Глобальный Middleware для обработки ошибок (Standard Error Response).
4. **Audit**: Все операции изменения данных должны логироваться (кто, когда, что изменил).

## 📐 Архитектурные правила (Frontend)
1. **Component Architecture**:
   - `core`: Си хочет-тоны (AuthService, ApiService, Guards).
   - `shared`: Переиспользуемые UI компоненты (Button, Input, Modal).
   - `features`: Модули по функционалу (requisitions, invoices, reports).
2. **State Management**: Использовать **Angular Signals** для реактивного состояния страниц.
3. **Data Flow**: Компоненты запрашивают данные через сервисы; данные передаются вниз через `@Input()` или Signals.
4. **Naming**: 
   - Компоненты: `feature-name.component.ts`
   - Сервисы: `feature-name.service.ts`
   - UI элементы: `pi-button`, `pi-card` (префикс `pi`).

## 📝 Правила разработки (Integrity & Quality)
- **Интеграция**: Каждое изменение в схеме данных (DB) требует обновления `docs/data-model.md`.
- **Документация**: Каждое новое UI-действие (кнопка, фильтр) требует обновления `docs/pages/<name>.page.md`.
- **Комментарии**: Все сложные расчеты (особенно в ОДР и Снабжении) должны быть подробно прокомментированы на русском языке.
- **Типизация**: Запрещено использование `any`. Все ответы API должны иметь интерфейсы.
- **Snapshotting**: При переходе объекта из одного статуса в другой (например, Заявка → Счет) создавать неизменяемый снимок данных.
- **Clean Code**: DRY, KISS. Если функция занимает > 50 строк, разбивать на мелкие приватные методы.
