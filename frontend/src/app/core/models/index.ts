/**
 * Общие модели предметной области (T-4.2).
 * Единый источник интерфейсов для компонентов и сервисов —
 * вместо дублирования `interface` внутри каждого компонента.
 */

export interface DictionaryItem {
  _id?: string;
  category: string;
  name: string;
  value: string;
  isActive?: boolean;
}

export interface Requisition {
  _id?: string;
  date?: string;
  category: string;
  itemName: string;
  sku?: string;
  unit: string;
  quantity: number;
  requestedBy?: string;
  priority: string;
  status: string;
  company: string;
  customer: string;
  supplier: string;
  link?: string;
  color?: string;
  note?: string;
  priceWithVat: number;
}

export interface InvoiceItem {
  itemName: string;
  quantity: number;
  price: number;
  sum: number;
}

export interface Invoice {
  _id?: string;
  invoiceNumber: string;
  invoiceDate: string;
  supplier: string;
  invoiceType: string;
  company: string;
  items: InvoiceItem[];
  totalAmount: number;
  isPaid: boolean;
  note?: string;
}

export interface OrderItem {
  itemTitle: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
}

export interface Order {
  _id?: string;
  orderNumber: string;
  customer: string;
  status: string;
  items?: OrderItem[];
  totalAmount: number;
  orderDate?: string;
  note?: string;
}

export interface Product {
  _id?: string;
  supplierArticle: string;
  internalSku: string;
  category: string;
  subcategory: string;
  brand: string;
  name: string;
  size: string;
  supplier: string;
  price: number;
  unit: string;
  fullName: string;
}

export interface StockItem {
  _id?: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  freeStock: number;
  minStock: number;
  status: string;
}

export interface Movement {
  _id?: string;
  date: string;
  type: 'INCOME' | 'OUTCOME';
  itemName: string;
  quantity: number;
  unit: string;
  note: string;
}

export interface AdditionalIncome {
  _id?: string;
  date: string;
  amount: number | null;
  category: string;
  note?: string;
}

export interface OdrReport {
  totalIncome: number;
  totalExpense: number;
  net: number;
  range: { startDate: string; endDate: string };
}
