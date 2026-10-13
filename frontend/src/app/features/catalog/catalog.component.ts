import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models';

/**
 * Каталог номенклатуры (T-3.1): данные из `db_spotninyg - products.csv`.
 * Клиентская фильтрация по поиску и категории.
 */
@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="row-between mb-4">
        <div>
          <h1 class="page-title">Каталог</h1>
          <p class="muted">Номенклатура из products.csv — {{ filtered.length }} из {{ items.length }}</p>
        </div>
      </div>

      <div class="alert alert-error" *ngIf="error">{{ error }}</div>

      <div class="row mb-2">
        <input class="grow" type="text" placeholder="Поиск по названию, SKU, бренду…" [(ngModel)]="search" (input)="applyFilter()" />
        <select [(ngModel)]="category" (change)="applyFilter()">
          <option value="">Все категории</option>
          <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
        </select>
      </div>

      <div class="table-wrap">
        <table class="data">
          <thead>
            <tr>
              <th>Артикул / SKU</th>
              <th>Наименование</th>
              <th>Категория</th>
              <th>Бренд</th>
              <th class="num">Цена</th>
              <th>Ед.</th>
              <th>Поставщик</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of filtered">
              <td>
                <div>{{ p.supplierArticle }}</div>
                <div class="muted small">{{ p.internalSku }}</div>
              </td>
              <td>
                <div>{{ p.name }}</div>
                <div class="muted small" *ngIf="p.size">{{ p.size }}</div>
              </td>
              <td class="muted">{{ p.category }}<span *ngIf="p.subcategory"> / {{ p.subcategory }}</span></td>
              <td class="muted">{{ p.brand }}</td>
              <td class="num">{{ p.price | number:'1.2-2' }}</td>
              <td>{{ p.unit }}</td>
              <td class="muted">{{ p.supplier }}</td>
            </tr>
          </tbody>
        </table>
        <div class="empty" *ngIf="!loading && filtered.length === 0">
          <div class="empty-title">Каталог пуст</div>
          <div>Запустите seed — он загрузит номенклатуру из products.csv</div>
        </div>
      </div>

      <div class="spinner" *ngIf="loading"></div>
    </div>
  `,
  styles: [`
    .page { max-width: 1200px; margin: 0 auto; }
    .page-title { margin: 0 0 2px; font-size: 22px; }
    .small { font-size: 11.5px; }
  `],
})
export class CatalogComponent implements OnInit {
  items: Product[] = [];
  filtered: Product[] = [];
  categories: string[] = [];
  search = '';
  category = '';
  loading = false;
  error = '';

  private readonly destroyRef = inject(DestroyRef);

  constructor(private readonly productService: ProductService) {}

  ngOnInit(): void {
    this.loading = true;
    this.productService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.items = data;
          this.categories = Array.from(new Set(data.map(p => p.category).filter(Boolean))).sort();
          this.applyFilter();
        },
        error: () => (this.error = 'Не удалось загрузить каталог'),
        complete: () => (this.loading = false),
      });
  }

  applyFilter(): void {
    const query = this.search.trim().toLowerCase();
    this.filtered = this.items.filter(p => {
      const matchesSearch = !query
        || p.name.toLowerCase().includes(query)
        || p.fullName.toLowerCase().includes(query)
        || p.internalSku.toLowerCase().includes(query)
        || p.supplierArticle.toLowerCase().includes(query)
        || p.brand.toLowerCase().includes(query);
      const matchesCategory = !this.category || p.category === this.category;
      return matchesSearch && matchesCategory;
    });
  }
}
