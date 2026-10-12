import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { API_URL } from '../../core/api';

interface StockItem {
  _id?: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  freeStock: number;
  minStock: number;
  status: string;
}

interface Movement {
  _id?: string;
  date: string;
  type: 'INCOME' | 'OUTCOME';
  itemName: string;
  quantity: number;
  unit: string;
  note: string;
}

@Component({
  selector: 'app-warehouse',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="row-between mb-4">
        <div>
          <h1 class="page-title">Склад</h1>
          <p class="muted">Остатки ТМЦ и журнал движений</p>
        </div>
      </div>

      <div class="alert alert-error" *ngIf="error">{{ error }}</div>

      <div class="row-between mb-2">
        <h2 class="section-title">Остатки</h2>
        <div class="row">
          <input class="grow" type="text" placeholder="Поиск по наименованию…" [(ngModel)]="search" (input)="applyFilter()" />
          <select [(ngModel)]="onlyCritical" (change)="applyFilter()">
            <option [value]="false">Все</option>
            <option [value]="true">Только критические</option>
          </select>
        </div>
      </div>

      <div class="table-wrap mb-4">
        <table class="data">
          <thead>
            <tr>
              <th>Наименование</th>
              <th>Категория</th>
              <th class="num">Ед.</th>
              <th class="num">Текущий</th>
              <th class="num">Свободный</th>
              <th class="num">Мин.</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of filtered">
              <td>{{ item.name }}</td>
              <td class="muted">{{ item.category }}</td>
              <td>{{ item.unit }}</td>
              <td class="num">{{ item.currentStock }}</td>
              <td class="num">{{ item.freeStock }}</td>
              <td class="num">{{ item.minStock }}</td>
              <td>
                <span class="badge" [class]="stockClass(item)">{{ item.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="empty" *ngIf="!loading && filtered.length === 0">
          <div class="empty-title">Склад пуст</div>
          <div>Запустите seed — он загрузит остатки из «Склад.csv»</div>
        </div>
      </div>

      <h2 class="section-title mb-2">Журнал движений</h2>
      <div class="table-wrap">
        <table class="data">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Тип</th>
              <th>Наименование</th>
              <th class="num">Кол-во</th>
              <th>Примечание</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let m of movements">
              <td>{{ m.date | date:'dd.MM.yyyy HH:mm' }}</td>
              <td>
                <span class="badge" [class]="m.type === 'INCOME' ? 'badge-green' : 'badge-red'">
                  {{ m.type === 'INCOME' ? '➕ Приход' : '➖ Расход' }}
                </span>
              </td>
              <td>{{ m.itemName }}</td>
              <td class="num">{{ m.quantity }} {{ m.unit }}</td>
              <td class="muted">{{ m.note }}</td>
            </tr>
          </tbody>
        </table>
        <div class="empty" *ngIf="!loadingMovements && movements.length === 0">
          <div class="empty-title">Движений нет</div>
        </div>
      </div>

      <div class="spinner" *ngIf="loading || loadingMovements"></div>
    </div>
  `,
  styles: [`
    .page { max-width: 1100px; margin: 0 auto; }
    .page-title { margin: 0 0 2px; font-size: 22px; }
    .section-title { margin: 0; font-size: 16px; }
  `],
})
export class WarehouseComponent implements OnInit {
  items: StockItem[] = [];
  movements: Movement[] = [];
  filtered: StockItem[] = [];
  search = '';
  onlyCritical = false;
  loading = false;
  loadingMovements = false;
  error = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchStock();
    this.fetchMovements();
  }

  fetchStock(): void {
    this.loading = true;
    this.http
      .get<StockItem[]>(`${API_URL}/api/stockItems`)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: data => {
          this.items = data;
          this.applyFilter();
        },
        error: () => (this.error = 'Не удалось загрузить остатки'),
        complete: () => (this.loading = false),
      });
  }

  fetchMovements(): void {
    this.loadingMovements = true;
    this.http
      .get<Movement[]>(`${API_URL}/api/warehouse`)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: data => (this.movements = data),
        complete: () => (this.loadingMovements = false),
      });
  }

  applyFilter(): void {
    const query = this.search.trim().toLowerCase();
    this.filtered = this.items.filter(item => {
      const matchesSearch = !query || item.name.toLowerCase().includes(query);
      const matchesCritical = !this.onlyCritical || item.currentStock <= item.minStock;
      return matchesSearch && matchesCritical;
    });
  }

  stockClass(item: StockItem): string {
    if (item.currentStock <= item.minStock) return 'badge-red';
    if (item.currentStock <= item.minStock * 2) return 'badge-amber';
    return 'badge-green';
  }
}
