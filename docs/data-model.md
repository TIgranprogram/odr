# DATA MODEL (Схема данных MongoDB)

> Правило `docs/TECH_STACK & GUIDELINES.md`: **каждое изменение схемы данных
> требует обновления этого файла.** Схемы: `backend/src/models/*.ts`.
> Актуально на: 14.10.2026 (после внедрения T-6.1…T-6.6).

## 0. Общие правила коллекций

- **`organizationId: string`** — владелец записи (T-6.1 tenant isolation).
  Дефолт — `DEFAULT_ORGANIZATION_ID = 'default-org'` (`backend/src/utils/tenant.ts`).
  Значение берётся из JWT (`getOrgId(req)`), сервисы фильтруют по нему.
  Сейчас проект фактически single-tenant: поле заложено под мультиарендность.
- **`timestamps: true`** → `createdAt`/`updatedAt` есть у всех, кроме
  `RequisitionSnapshot` (только `capturedAt`).
- **Все модули имеют `toJSON/toObject: virtuals: true`** — ответы API содержат `id`.
- Записи аудита и снимки создаются сервисами; ошибки их записи **не роняют**
  основную операцию.

## 1. Пользователи

### `users` — `User.ts`
| Поле | Тип | Обяз. | Примечание |
|---|---|---|---|
| `username` | string | ✅ | **unique**, trim |
| `password` | string | ✅ | bcrypt-хэш (не отдаётся в API) |
| `fullName` | string | ✅ | ФИО |
| `role` | enum | | `ADMIN` \| `USER`, default `USER` |
| `isActive` | boolean | | default `true`, проверяется при входе |
| `organizationId` | string | | дефолт `default-org` |

Индексы: `username` (unique). Связей нет.

## 2. Справочники

### `dictionaries` — `Dictionary.ts`
| Поле | Тип | Обяз. | Примечание |
|---|---|---|---|
| `name` | string | ✅ | наименование, trim |
| `category` | string | ✅ | `Types`, `Units`, `Suppliers`, `Customers`, … |
| `value` | string | ✅ | значение, trim |
| `isActive` | boolean | | default `true` |
| `meta` | object (Mixed) | | свободные доп.данные |
| `organizationId` | string | | |

Индексы: `{ category: 1, value: 1 }`. Связей нет (используется как справочник значений).

## 3. Снабжение

### `requisitions` — `Requisition.ts`
| Поле | Тип | Обяз. | Примечание |
|---|---|---|---|
| `date` | Date | | default `now` |
| `category` | string | | default `'Прочее'` |
| `itemName` | string | ✅ | |
| `sku` | string | | |
| `unit` | string | | |
| `quantity` | number | ✅ | |
| `requestedBy` | string | ✅ | подставляется из JWT |
| `priority` | enum | | `Срочно` \| `Обычный` \| `Низко`, default `Обычный` |
| `status` | string | | default `⏳ Ожидает` |
| `company` | enum | | `СИЮ` \| `ССЮ`, default `СИЮ` |
| `customer` | string | | default `''` |
| `supplier` / `link` / `color` / `note` | string | | |
| `priceWithVat` | number | ✅ | цена с НДС |
| `orderRef` | ObjectId | | → `Order` |
| `orderItemRef` | ObjectId | | → `Order` (пункт заказа) |
| `invoiceRef` | ObjectId | | → `Invoice`; заполнен → заявка уже учтена в ОДР |
| `organizationId` | string | | |

Индексы: `{ date: -1 }`, `{ status: 1 }`, `{ customer: 1 }` (T-6.6).

### `invoices` — `Invoice.ts`
| Поле | Тип | Обяз. | Примечание |
|---|---|---|---|
| `invoiceNumber` | string | ✅ | **unique** |
| `invoiceDate` | Date | | default `now` |
| `supplier` | string | ✅ | |
| `invoiceType` | string | ✅ | |
| `company` | enum | ✅ | `СИЮ` \| `ССЮ` |
| `items[]` | subdoc | ✅ | `{ itemName, quantity, price, sum }` |
| `totalAmount` | number | ✅ | |
| `isPaid` | boolean | | default `false` |
| `note` | string | | |
| `organizationId` | string | | |

Индексы: `invoiceNumber` (unique), `{ invoiceDate: -1 }`, `{ isPaid: 1 }`.

### `orders` — `Order.ts`
| Поле | Тип | Обяз. | Примечание |
|---|---|---|---|
| `orderNumber` | string | ✅ | **unique** |
| `customer` | string | ✅ | |
| `status` | string | | default `В работе` |
| `items[]` | subdoc | ✅ | `{ itemTitle, quantity, unit, price, total }` |
| `totalAmount` | number | ✅ | |
| `orderDate` | Date | | default `now` |
| `note` | string | | |
| `organizationId` | string | | |

Индексы: `orderNumber` (unique), `{ orderDate: -1 }`, `{ customer: 1 }`.

### `products` — `Product.ts` (каталог)
| Поле | Тип | Обяз. | Примечание |
|---|---|---|---|
| `supplierArticle` | string | | default `''` (артикул поставщика) |
| `internalSku` | string | ✅ | **unique**, trim — ключ связи |
| `category` / `subcategory` / `brand` / `size` / `supplier` / `unit` / `fullName` | string | | default `''` |
| `name` | string | ✅ | модель/наименование |
| `price` | number | | default `0` |
| `organizationId` | string | | |

Индексы: `internalSku` (unique), `{ category: 1 }`, `{ name: 1 }`.
Источник: `данные для заполнения на сайте/data/db_spotninyg - products.csv` (288 позиций).

## 4. Склад

### `stockitems` — `StockItem.ts` (остатки)
| Поле | Тип | Обяз. | Примечание |
|---|---|---|---|
| `name` | string | ✅ | |
| `category` / `unit` | string | ✅ | |
| `initialStock` / `received` / `reserved` / `writtenOff` / `currentStock` / `freeStock` | number | | default `0` |
| `status` | string | | default `✅ В норме` |
| `minStock` / `weight` | number | | default `0` |
| `categoryRef` | ObjectId | | → `Dictionary` |
| `unitRef` | ObjectId | | → `Dictionary` |
| `organizationId` | string | | |

Индексы: `{ name: 1 }`, `{ category: 1 }`.

### `warehouseMovements` — `WarehouseMovement.ts` (журнал движений)
| Поле | Тип | Обяз. | Примечание |
|---|---|---|---|
| `type` | enum | | **`INCOME` (приход) \| `OUTCOME` (списание)**, default `INCOME` |
| `date` | Date | ✅ | default `now` |
| `itemName` | string | ✅ | |
| `quantity` | number | ✅ | |
| `unit` | string | | |
| `targetOrderItemRef` | ObjectId | | → `Order` (списание по пункту заказа) |
| `note` | string | | |
| `organizationId` | string | | |

Индексы: `{ date: -1 }`.

## 5. Аналитика (ОДР)

### `additionalincomes` — `AdditionalIncome.ts` (прочие поступления)
| Поле | Тип | Обяз. | Примечание |
|---|---|---|---|
| `date` | Date | ✅ | default `now`; по ней фильтруется период |
| `amount` | number | ✅ | `min: 0` |
| `category` | string | ✅ | напр. «Услуги», «Возврат» |
| `note` | string | | |
| `organizationId` | string | | |

Индексы: `{ date: -1 }`. Учитывается в `totalIncome` ОДР.

## 6. Контроль изменений (T-6.2 / T-6.3)

### `auditlogs` — `AuditLog.ts` (журнал аудита)
| Поле | Тип | Обяз. | Примечание |
|---|---|---|---|
| `entityType` | string | ✅ | `requisitions`, `invoices`, `orders`, `warehouse`, … |
| `entityId` | ObjectId | ✅ | идентификатор изменённого документа |
| `action` | enum | ✅ | `CREATE` \| `UPDATE` \| `DELETE` |
| `userId` / `username` | string | | из JWT |
| `changes[]` | subdoc | | shallow-diff `{ field, before, after }` |
| `organizationId` | string | | |

Индексы: `{ createdAt: -1 }`, `{ entityType: 1, createdAt: -1 }`.
Записывается всеми контроллерами через `audit.service.logEntityAction`;
**изменение/удаление записей аудита через API не предусмотрено** (только чтение, `ADMIN`).

### `requisitionsnapshots` — `RequisitionSnapshot.ts` (неизменяемые снимки)
| Поле | Тип | Обяз. | Примечание |
|---|---|---|---|
| `requisitionId` | ObjectId | ✅ | → `Requisition` |
| `previousStatus` / `status` | string | `status` ✅ | переход статуса |
| `itemName`, `sku`, `unit`, `category`, `company`, `priority`, `customer`, `supplier`, `color`, `link`, `note` | string | `itemName` ✅ | копии полей на момент перехода |
| `quantity` / `priceWithVat` / `lineTotal` | number | ✅ | `lineTotal = priceWithVat × quantity` |
| `requestedBy`, `date`, `orderRef`, `invoiceRef`, `capturedBy` | — | | |
| `organizationId` | string | | |
| `capturedAt` | Date | | `createdAt` (только создание) |

Индексы: `{ requisitionId: 1 }`.
Создаётся в `requisition.controller` при **смене статуса** заявки.
**Неизменяемость:** Mongoose-хуки `pre` запрещают `update*`, `replace*`, `delete*`
→ правка истории невозможна.

## 7. Схема связей

```
Dictionary ────────────┐
  (categoryRef/unitRef)│        Order ───────────┐
                       ▼        (orderRef/       │
StockItem ◄────────────┘         orderItemRef/   │
                                  targetOrderItemRef)
                        ▲                        │
                        └── Requisition ─────────┤
                                   │             │
                                   └──► Invoice  │
                                        (invoiceRef)

RequisitionSnapshot.requisitionId ──► Requisition   (неизменяемый снимок)
AuditLog.entityId ──────────────────► любая сущность (по entityType)
```

## 8. Индексы сводно (T-6.6)

| Коллекция | Индекс |
|---|---|
| User | `username` (unique) |
| Dictionary | `{ category, value }` |
| Requisition | `{ date:-1 }`, `{ status }`, `{ customer }` |
| Invoice | `invoiceNumber` (unique), `{ invoiceDate:-1 }`, `{ isPaid }` |
| Order | `orderNumber` (unique), `{ orderDate:-1 }`, `{ customer }` |
| Product | `internalSku` (unique), `{ category }`, `{ name }` |
| StockItem | `{ name }`, `{ category }` |
| WarehouseMovement | `{ date:-1 }` |
| AdditionalIncome | `{ date:-1 }` |
| AuditLog | `{ createdAt:-1 }`, `{ entityType, createdAt:-1 }` |
| RequisitionSnapshot | `{ requisitionId }` |

## 9. Источники данных (seed)

`backend/scripts/seed.ts` — одноразовый сервис `seed` при `docker compose up`
(монтирует `данные для заполнения на сайте/data → /data/seed`):

| Файл | Коллекция |
|---|---|
| `Склад - Склад.csv` | `StockItem` (242) |
| `Снабжение - Снабжение.csv` | `Dictionary` (Types/Units/Suppliers/Customers) |
| `db_spotninyg - products.csv` | `Product` (288) |
| — | `Requisition` (147), `User` (admin/admin123) |

⚠️ Seed **очищает** эти коллекции перед заливкой: ручные данные теряются при
каждом `docker compose up`. `AuditLog`/`RequisitionSnapshot` при этом не трогаются.
