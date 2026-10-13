# docs/pages — описание экранов

Каждый экран приложения имеет свой файл `<name>.page.md`. Правило
(`docs/TECH_STACK & GUIDELINES.md`): при добавлении/изменении UI-действия
(кнопка, фильтр, форма) обновляйте соответствующий файл.

## Шаблон

```md
# Страница: <Название>
- **Маршрут:** `/<path>`  ·  **Компонент:** `frontend/src/app/features/...`
- **Доступ:** ...

## Назначение
## UI-действия   (таблица: Элемент → Действие → Результат)
## API           (таблица: Метод → Путь → Когда)
## Уведомления и ошибки
## Связи
```

## Экраны

| Файл | Маршрут | Назначение |
|---|---|---|
| [`login.page.md`](login.page.md) | `/login` | Вход в систему |
| [`shell.page.md`](shell.page.md) | — (layout) | Оболочка: sidebar, header, тосты |
| [`requisitions.page.md`](requisitions.page.md) | `/requisitions` | Панель снабжения — заявки |
| [`orders.page.md`](orders.page.md) | `/orders` | Заказы |
| [`invoices.page.md`](invoices.page.md) | `/invoices` | Счета |
| [`warehouse.page.md`](warehouse.page.md) | `/warehouse` | Склад: остатки и движения |
| [`catalog.page.md`](catalog.page.md) | `/catalog` | Каталог продуктов |
| [`dictionaries.page.md`](dictionaries.page.md) | `/dictionaries` | Справочники |
| [`odr.page.md`](odr.page.md) | `/reports/odr` | Отчёт ОДР + прочие поступления |
