const bearerAuth = [{ bearerAuth: [] }];

const errorSchema = {
  type: 'object',
  properties: { error: { type: 'string', example: 'Внутренняя ошибка' } },
};

const jsonError = (description: string) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
});

const jsonOk = (ref: string, description = 'OK', isArray = false) => ({
  description,
  content: {
    'application/json': {
      schema: isArray ? { type: 'array', items: { $ref: `#/components/schemas/${ref}` } } : { $ref: `#/components/schemas/${ref}` },
    },
  },
});

const idParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string' },
  description: 'MongoDB ObjectId',
};

/**
 * OpenAPI 3.0 спецификация API ODR.
 * Отдаётся по GET /api/openapi.json, UI — GET /api/docs (Swagger UI).
 * Спецификация написана вручную (без кодогенерации) — держите её в актуальном
 * состоянии при изменении роутов.
 */
export const openapiSpec: Record<string, unknown> = {
  openapi: '3.0.3',
  info: {
    title: 'ODR API',
    version: '1.0.0',
    description:
      'API системы автоматизации снабжения и учёта (заявки, счета, заказы, склад, каталог, ОДР).\n\n' +
      'Авторизация: `POST /api/auth/login` → `accessToken` (15м) и `refreshToken` (7д). ' +
      'Токен передаётся как `Authorization: Bearer <accessToken>`. Все маршруты `/api/*` ' +
      'кроме `/api/auth/login`, `/api/auth/refresh` требуют токен.',
  },
  servers: [{ url: '/', description: 'Текущий хост' }],
  tags: [
    { name: 'Auth' },
    { name: 'Users' },
    { name: 'Dictionaries' },
    { name: 'Requisitions' },
    { name: 'Invoices' },
    { name: 'Orders' },
    { name: 'Warehouse' },
    { name: 'StockItems' },
    { name: 'Products' },
    { name: 'AdditionalIncomes' },
    { name: 'ODR' },
    { name: 'Audit' },
    { name: 'System' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: errorSchema,
      Health: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['ok', 'degraded'] },
          db: { type: 'string', enum: ['up', 'down'] },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', example: 'admin' },
          password: { type: 'string', format: 'password', example: 'admin123' },
        },
      },
      RefreshRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: { refreshToken: { type: 'string' } },
      },
      AuthTokens: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
          user: { $ref: '#/components/schemas/AuthUser' },
        },
      },
      AuthUser: {
        type: 'object',
        properties: {
          username: { type: 'string' },
          fullName: { type: 'string' },
          role: { type: 'string', enum: ['ADMIN', 'USER'] },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          username: { type: 'string' },
          fullName: { type: 'string' },
          role: { type: 'string', enum: ['ADMIN', 'USER'] },
          isActive: { type: 'boolean' },
        },
      },
      Dictionary: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          category: { type: 'string', example: 'Suppliers' },
          name: { type: 'string' },
        },
      },
      Requisition: {
        type: 'object',
        required: ['itemName', 'quantity', 'customer', 'priceWithVat'],
        properties: {
          _id: { type: 'string' },
          date: { type: 'string', format: 'date-time' },
          category: { type: 'string' },
          itemName: { type: 'string' },
          quantity: { type: 'number' },
          unit: { type: 'string' },
          supplier: { type: 'string' },
          customer: { type: 'string' },
          company: { type: 'string', example: 'СИЮ' },
          priority: { type: 'string' },
          status: { type: 'string', example: '⏳ Ожидает' },
          priceWithVat: { type: 'number' },
          invoiceRef: { type: 'string', nullable: true },
        },
      },
      InvoiceItem: {
        type: 'object',
        properties: {
          itemTitle: { type: 'string' },
          quantity: { type: 'number' },
          unit: { type: 'string' },
          price: { type: 'number' },
          total: { type: 'number' },
        },
      },
      Invoice: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          invoiceNumber: { type: 'string' },
          date: { type: 'string', format: 'date-time' },
          supplier: { type: 'string' },
          status: { type: 'string' },
          totalAmount: { type: 'number' },
          items: { type: 'array', items: { $ref: '#/components/schemas/InvoiceItem' } },
        },
      },
      Order: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          orderNumber: { type: 'string' },
          date: { type: 'string', format: 'date-time' },
          customer: { type: 'string' },
          status: { type: 'string' },
          totalAmount: { type: 'number' },
          items: { type: 'array', items: { $ref: '#/components/schemas/InvoiceItem' } },
        },
      },
      StockItem: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          itemName: { type: 'string' },
          quantity: { type: 'number' },
          unit: { type: 'string' },
          location: { type: 'string' },
        },
      },
      WarehouseMovement: {
        type: 'object',
        required: ['type', 'date', 'itemName', 'quantity'],
        properties: {
          _id: { type: 'string' },
          type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
          date: { type: 'string', format: 'date-time' },
          itemName: { type: 'string' },
          quantity: { type: 'number' },
          unit: { type: 'string' },
          note: { type: 'string' },
        },
      },
      Product: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          supplierSku: { type: 'string' },
          internalSku: { type: 'string', description: 'Уникальный внутренний SKU' },
          category: { type: 'string' },
          subcategory: { type: 'string' },
          brand: { type: 'string' },
          model: { type: 'string' },
          size: { type: 'string' },
          supplier: { type: 'string' },
          price: { type: 'number' },
          unit: { type: 'string' },
          photo: { type: 'string' },
          fullName: { type: 'string' },
        },
      },
      AdditionalIncome: {
        type: 'object',
        required: ['date', 'amount', 'category'],
        properties: {
          _id: { type: 'string' },
          date: { type: 'string', format: 'date-time' },
          amount: { type: 'number' },
          category: { type: 'string' },
          note: { type: 'string' },
        },
      },
      OdrReport: {
        type: 'object',
        properties: {
          totalIncome: { type: 'number' },
          totalExpense: { type: 'number' },
          net: { type: 'number' },
          range: {
            type: 'object',
            properties: {
              startDate: { type: 'string', format: 'date-time' },
              endDate: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      PagedRequisitions: {
        type: 'object',
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/Requisition' } },
          total: { type: 'number' },
          page: { type: 'number' },
          limit: { type: 'number' },
        },
      },
      RequisitionSnapshot: {
        type: 'object',
        description: 'Неизменяемый снимок заявки на момент перехода статуса (T-6.2)',
        properties: {
          _id: { type: 'string' },
          requisitionId: { type: 'string' },
          previousStatus: { type: 'string', example: '⏳ Ожидает' },
          status: { type: 'string', example: '☑️ Получено' },
          itemName: { type: 'string' },
          sku: { type: 'string' },
          unit: { type: 'string' },
          category: { type: 'string' },
          company: { type: 'string' },
          priority: { type: 'string' },
          customer: { type: 'string' },
          supplier: { type: 'string' },
          color: { type: 'string' },
          link: { type: 'string' },
          note: { type: 'string' },
          quantity: { type: 'number' },
          priceWithVat: { type: 'number' },
          lineTotal: { type: 'number', description: 'priceWithVat * quantity на момент перехода' },
          requestedBy: { type: 'string' },
          date: { type: 'string', format: 'date-time' },
          orderRef: { type: 'string', nullable: true },
          invoiceRef: { type: 'string', nullable: true },
          capturedBy: { type: 'string', description: 'Username, совершивший переход' },
          organizationId: { type: 'string' },
          capturedAt: { type: 'string', format: 'date-time' },
        },
      },
      AuditChange: {
        type: 'object',
        properties: {
          field: { type: 'string', example: 'status' },
          before: { description: 'Значение до изменения' },
          after: { description: 'Значение после изменения' },
        },
      },
      AuditLog: {
        type: 'object',
        description: 'Запись журнала аудита (T-6.3): кто/когда/что изменил',
        properties: {
          _id: { type: 'string' },
          entityType: { type: 'string', example: 'requisitions' },
          entityId: { type: 'string' },
          action: { type: 'string', enum: ['CREATE', 'UPDATE', 'DELETE'] },
          userId: { type: 'string' },
          username: { type: 'string', example: 'admin' },
          changes: { type: 'array', items: { $ref: '#/components/schemas/AuditChange' } },
          organizationId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      PagedAuditLogs: {
        type: 'object',
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/AuditLog' } },
          total: { type: 'number' },
          page: { type: 'number' },
          limit: { type: 'number' },
        },
      },
    },
  },
  security: bearerAuth,
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Проверка живости сервиса и БД',
        security: [],
        responses: { '200': jsonOk('Health'), '503': jsonOk('Health', 'БД недоступна') },
      },
    },
    '/api/openapi.json': {
      get: { tags: ['System'], summary: 'Эта OpenAPI-спецификация', security: [], responses: { '200': { description: 'OK' } } },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Вход (rate-limit 10/15 мин)',
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
        responses: {
          '200': jsonOk('AuthTokens', 'Успешный вход'),
          '400': jsonError('Невалидные данные'),
          '401': jsonError('Неверные учётные данные'),
          '429': jsonError('Слишком много попыток'),
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Обновить access-токен',
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshRequest' } } } },
        responses: { '200': jsonOk('AuthTokens'), '401': jsonError('Невалидный refresh-токен') },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Создать пользователя (только ADMIN)',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: { '201': jsonOk('User', 'Создан'), '403': jsonError('Только ADMIN'), '409': jsonError('Пользователь существует') },
      },
    },
    '/api/users': {
      get: { tags: ['Users'], summary: 'Список пользователей (ADMIN)', responses: { '200': jsonOk('User', 'OK', true) } },
      post: {
        tags: ['Users'],
        summary: 'Создать пользователя (ADMIN)',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
        responses: { '201': jsonOk('User', 'Создан'), '409': jsonError('Дубликат') },
      },
    },
    '/api/users/{id}': {
      get: { tags: ['Users'], summary: 'Пользователь по id (ADMIN)', parameters: [idParam], responses: { '200': jsonOk('User'), '404': jsonError('Не найден') } },
      put: {
        tags: ['Users'],
        summary: 'Изменить пользователя (ADMIN)',
        parameters: [idParam],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
        responses: { '200': jsonOk('User'), '400': jsonError('Невалидные данные') },
      },
      delete: { tags: ['Users'], summary: 'Удалить пользователя (ADMIN)', parameters: [idParam], responses: { '200': { description: 'OK' }, '400': jsonError('Нельзя удалить последнего ADMIN') } },
    },
    '/api/dictionaries': {
      get: { tags: ['Dictionaries'], summary: 'Все записи справочников', responses: { '200': jsonOk('Dictionary', 'OK', true) } },
      post: {
        tags: ['Dictionaries'],
        summary: 'Создать запись',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Dictionary' } } } },
        responses: { '201': jsonOk('Dictionary', 'Создана'), '400': jsonError('Невалидные данные') },
      },
    },
    '/api/dictionaries/{category}': {
      get: { tags: ['Dictionaries'], summary: 'Записи по категории', parameters: [{ name: 'category', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': jsonOk('Dictionary', 'OK', true) } },
    },
    '/api/dictionaries/{id}': {
      put: {
        tags: ['Dictionaries'],
        summary: 'Изменить запись',
        parameters: [idParam],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Dictionary' } } } },
        responses: { '200': jsonOk('Dictionary'), '400': jsonError('Невалидные данные') },
      },
      delete: { tags: ['Dictionaries'], summary: 'Удалить запись', parameters: [idParam], responses: { '200': { description: 'OK' } } },
    },
    '/api/requisitions': {
      get: {
        tags: ['Requisitions'],
        summary: 'Список заявок (фильтры search/status/customer)',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'customer', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': jsonOk('Requisition', 'OK', true) },
      },
      post: {
        tags: ['Requisitions'],
        summary: 'Создать заявку',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Requisition' } } } },
        responses: { '201': jsonOk('Requisition', 'Создана'), '400': jsonError('Невалидные данные') },
      },
    },
    '/api/requisitions/paged': {
      get: {
        tags: ['Requisitions'],
        summary: 'Постраничный список заявок',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'customer', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 25, maximum: 200 } },
          { name: 'sort', in: 'query', schema: { type: 'string', example: 'date:desc' } },
        ],
        responses: { '200': jsonOk('PagedRequisitions') },
      },
    },
    '/api/requisitions/{id}': {
      get: { tags: ['Requisitions'], summary: 'Заявка по id', parameters: [idParam], responses: { '200': jsonOk('Requisition'), '404': jsonError('Не найдена') } },
      put: {
        tags: ['Requisitions'],
        summary: 'Изменить заявку',
        parameters: [idParam],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Requisition' } } } },
        responses: { '200': jsonOk('Requisition'), '400': jsonError('Невалидные данные') },
      },
      delete: { tags: ['Requisitions'], summary: 'Удалить заявку', parameters: [idParam], responses: { '200': { description: 'OK' } } },
    },
    '/api/requisitions/{id}/snapshots': {
      get: {
        tags: ['Requisitions'],
        summary: 'Снимки заявки (неизменяемые, при переходах статуса)',
        parameters: [idParam],
        responses: { '200': jsonOk('RequisitionSnapshot', 'OK', true), '400': jsonError('Некорректный id') },
      },
    },
    '/api/invoices': {
      get: { tags: ['Invoices'], summary: 'Список счетов', responses: { '200': jsonOk('Invoice', 'OK', true) } },
      post: {
        tags: ['Invoices'],
        summary: 'Создать счёт',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Invoice' } } } },
        responses: { '201': jsonOk('Invoice', 'Создан'), '400': jsonError('Невалидные данные') },
      },
    },
    '/api/invoices/{id}': {
      get: { tags: ['Invoices'], summary: 'Счёт по id', parameters: [idParam], responses: { '200': jsonOk('Invoice'), '404': jsonError('Не найден') } },
      put: { tags: ['Invoices'], summary: 'Изменить счёт', parameters: [idParam], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Invoice' } } } }, responses: { '200': jsonOk('Invoice') } },
      delete: { tags: ['Invoices'], summary: 'Удалить счёт', parameters: [idParam], responses: { '200': { description: 'OK' } } },
    },
    '/api/orders': {
      get: { tags: ['Orders'], summary: 'Список заказов', responses: { '200': jsonOk('Order', 'OK', true) } },
      post: {
        tags: ['Orders'],
        summary: 'Создать заказ (с позициями)',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Order' } } } },
        responses: { '201': jsonOk('Order', 'Создан'), '400': jsonError('Невалидные данные') },
      },
    },
    '/api/orders/{id}': {
      get: { tags: ['Orders'], summary: 'Заказ по id', parameters: [idParam], responses: { '200': jsonOk('Order'), '404': jsonError('Не найден') } },
      put: { tags: ['Orders'], summary: 'Изменить заказ', parameters: [idParam], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Order' } } } }, responses: { '200': jsonOk('Order') } },
      delete: { tags: ['Orders'], summary: 'Удалить заказ', parameters: [idParam], responses: { '200': { description: 'OK' } } },
    },
    '/api/warehouse': {
      get: { tags: ['Warehouse'], summary: 'Журнал движений склада', responses: { '200': jsonOk('WarehouseMovement', 'OK', true) } },
      post: {
        tags: ['Warehouse'],
        summary: 'Создать движение (приход/списание)',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/WarehouseMovement' } } } },
        responses: { '201': jsonOk('WarehouseMovement', 'Создано'), '400': jsonError('Невалидные данные') },
      },
    },
    '/api/warehouse/{id}': {
      get: { tags: ['Warehouse'], summary: 'Движение по id', parameters: [idParam], responses: { '200': jsonOk('WarehouseMovement'), '404': jsonError('Не найдено') } },
      put: { tags: ['Warehouse'], summary: 'Изменить движение', parameters: [idParam], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/WarehouseMovement' } } } }, responses: { '200': jsonOk('WarehouseMovement') } },
      delete: { tags: ['Warehouse'], summary: 'Удалить движение', parameters: [idParam], responses: { '200': { description: 'OK' } } },
    },
    '/api/stockitems': {
      get: { tags: ['StockItems'], summary: 'Складские остатки', responses: { '200': jsonOk('StockItem', 'OK', true) } },
      post: { tags: ['StockItems'], summary: 'Создать позицию', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/StockItem' } } } }, responses: { '201': jsonOk('StockItem', 'Создана') } },
    },
    '/api/stockitems/{id}': {
      get: { tags: ['StockItems'], summary: 'Позиция по id', parameters: [idParam], responses: { '200': jsonOk('StockItem'), '404': jsonError('Не найдена') } },
      put: { tags: ['StockItems'], summary: 'Изменить позицию', parameters: [idParam], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/StockItem' } } } }, responses: { '200': jsonOk('StockItem') } },
      delete: { tags: ['StockItems'], summary: 'Удалить позицию', parameters: [idParam], responses: { '200': { description: 'OK' } } },
    },
    '/api/products': {
      get: {
        tags: ['Products'],
        summary: 'Каталог продуктов (поиск/категория)',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': jsonOk('Product', 'OK', true) },
      },
      post: { tags: ['Products'], summary: 'Добавить продукт', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } }, responses: { '201': jsonOk('Product', 'Добавлен'), '409': jsonError('Дубликат internalSku') } },
    },
    '/api/products/sku/{sku}': {
      get: { tags: ['Products'], summary: 'Продукт по внутреннему SKU', parameters: [{ name: 'sku', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': jsonOk('Product'), '404': jsonError('Не найден') } },
    },
    '/api/products/{id}': {
      get: { tags: ['Products'], summary: 'Продукт по id', parameters: [idParam], responses: { '200': jsonOk('Product'), '404': jsonError('Не найден') } },
    },
    '/api/additional-incomes': {
      get: { tags: ['AdditionalIncomes'], summary: 'Прочие поступления', responses: { '200': jsonOk('AdditionalIncome', 'OK', true) } },
      post: { tags: ['AdditionalIncomes'], summary: 'Добавить поступление', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AdditionalIncome' } } } }, responses: { '201': jsonOk('AdditionalIncome', 'Добавлено'), '400': jsonError('Невалидные данные') } },
    },
    '/api/additional-incomes/{id}': {
      get: { tags: ['AdditionalIncomes'], summary: 'Поступление по id', parameters: [idParam], responses: { '200': jsonOk('AdditionalIncome'), '404': jsonError('Не найдено') } },
      put: { tags: ['AdditionalIncomes'], summary: 'Изменить поступление', parameters: [idParam], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AdditionalIncome' } } } }, responses: { '200': jsonOk('AdditionalIncome') } },
      delete: { tags: ['AdditionalIncomes'], summary: 'Удалить поступление', parameters: [idParam], responses: { '200': { description: 'OK' } } },
    },
    '/api/odr': {
      get: {
        tags: ['ODR'],
        summary: 'Отчёт ОДР за период',
        parameters: [
          { name: 'start', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'end', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
        ],
        responses: { '200': jsonOk('OdrReport'), '400': jsonError('Невалидный период') },
      },
    },
    '/api/odr/summary': {
      get: { tags: ['ODR'], summary: 'Сводка ОДР', responses: { '200': { description: 'OK' } } },
    },
    '/api/audit-logs': {
      get: {
        tags: ['Audit'],
        summary: 'Журнал аудита (только ADMIN)',
        parameters: [
          { name: 'entityType', in: 'query', schema: { type: 'string', example: 'requisitions' } },
          { name: 'entityId', in: 'query', schema: { type: 'string', description: 'MongoDB ObjectId' } },
          { name: 'action', in: 'query', schema: { type: 'string', enum: ['CREATE', 'UPDATE', 'DELETE'] } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 25, maximum: 200 } },
        ],
        responses: {
          '200': jsonOk('PagedAuditLogs'),
          '400': jsonError('Невалидные параметры'),
          '403': jsonError('Только ADMIN'),
        },
      },
    },
  },
};
