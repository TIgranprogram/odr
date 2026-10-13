/**
 * Единые константы справочников и статусов.
 * Синхронизированы с backend (models/Requisition.ts) и seed-скриптом.
 */

/** Категории справочника (должны совпадать с Dictionary.category в seed). */
export const DICTIONARY_CATEGORIES = ['Types', 'Units', 'Suppliers', 'Customers'] as const;

/** Человекочитаемые названия категорий справочника. */
export const DICTIONARY_LABELS: Record<string, string> = {
  Types: 'Типы товаров',
  Units: 'Единицы измерения',
  Suppliers: 'Поставщики',
  Customers: 'Заказчики',
};

/** Статусы заявки — совпадают с Requisition.status в схеме. */
export const STATUSES = ['⏳ Ожидает', '✅ Заказать', '⚙️ В работе', '💰 Оплачено', '☑️ Получено', 'Отменено'] as const;

/** Приоритеты — совпадают с реальными данными CSV. */
export const PRIORITIES = ['Срочно', 'Обычный', 'Низко'] as const;

/** Компании. */
export const COMPANIES = ['СИЮ', 'ССЮ'] as const;

/** Единицы измерения по умолчанию. */
export const DEFAULT_UNITS = ['шт', 'кг', 'м', 'л', 'упак', 'комплект'] as const;

/** Категории «Прочих поступлений» (ОДР) — ручной выбор при вводе дохода. */
export const INCOME_CATEGORIES = ['Услуги', 'Возврат', 'Продажа прочего', 'Штрафы/пени', 'Прочее'] as const;
