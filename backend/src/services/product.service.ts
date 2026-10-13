import { Product, IProduct } from '../models/Product';

/**
 * Каталог номенклатуры (read-only + создание). Именованные экспорты —
 * контроллер подключает через `import * as ProductService`.
 */

export interface ProductQuery {
  category?: string;
  supplier?: string;
  search?: string;
}

export const getAll = async (query: ProductQuery = {}): Promise<IProduct[]> => {
  const filter: Record<string, unknown> = {};
  if (query.category) filter.category = query.category;
  if (query.supplier) filter.supplier = query.supplier;
  if (query.search) {
    const rx = new RegExp(String(query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { fullName: rx }, { internalSku: rx }, { supplierArticle: rx }, { brand: rx }];
  }
  return await Product.find(filter).sort({ category: 1, name: 1 }).exec();
};

export const getById = async (id: string): Promise<IProduct | null> => {
  return await Product.findById(id).exec();
};

export const getBySku = async (sku: string): Promise<IProduct | null> => {
  return await Product.findOne({ internalSku: sku }).exec();
};

export const create = async (data: Partial<IProduct>): Promise<IProduct> => {
  const item = new Product(data);
  return await item.save();
};
