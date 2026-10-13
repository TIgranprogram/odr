import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { inject, DestroyRef } from '@angular/core';
import { WarehouseService } from '../../core/services/warehouse.service';
import { ToastService } from '../../core/services/toast.service';
import { Movement, StockItem } from '../../core/models';

interface MovementForm {
  date: string;
  type: 'INCOME' | 'OUTCOME';
  itemName: string;
  quantity: number | null;
  unit: string;
  note: string;
}

const emptyMovement = (): MovementForm => ({
  date: new Date().toISOString().slice(0, 10),
  type: 'INCOME',
  itemName: '',
  quantity: null,
  unit: 'шт',
  note: '',
});

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

      <div class="row-between mb-2">
        <h2 class="section-title">Журнал движений</h2>
        <button class="btn-primary" (click)="openMovement()">＋ Движение</button>
      </div>
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
          <div>Добавьте первое движение кнопкой выше</div>
        </div>
      </div>

      <div class="spinner" *ngIf="loading || loadingMovements"></div>

      <div class="modal-backdrop" *ngIf="showForm" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="row-between mb-4">
            <h2 class="modal-title">Новое движение</h2>
            <button class="btn-ghost" aria-label="Закрыть" (click)="closeForm()">✕</button>
          </div>
          <form (ngSubmit)="saveMovement()">
            <div class="grid">
              <div class="field">
                <label>Тип *</label>
                <select [(ngModel)]="form.type" name="type" required>
                  <option value="INCOME">➕ Приход</option>
                  <option value="OUTCOME">➖ Расход</option>
                </select>
              </div>
              <div class="field">
                <label>Дата</label>
                <input [(ngModel)]="form.date" name="date" type="date" />
              </div>
              <div class="field">
                <label>Наименование *</label>
                <input [(ngModel)]="form.itemName" name="itemName" list="stockNames" required />
                <datalist id="stockNames">
                  <option *ngFor="let i of items" [value]="i.name"></option>
                </datalist>
              </div>
              <div class="field">
                <label>Количество *</label>
                <input [(ngModel)]="form.quantity" name="quantity" type="number" min="0" step="0.01" required />
              </div>
              <div class="field">
                <label>Ед. изм.</label>
                <input [(ngModel)]="form.unit" name="unit" />
              </div>
              <div class="field">
                <label>Примечание</label>
                <input [(ngModel)]="form.note" name="note" />
              </div>
            </div>
            <div class="row mt-2">
              <button type="submit" class="btn-primary" [disabled]="saving">{{ saving ? 'Сохранение…' : 'Сохранить' }}</button>
              <button type="button" (click)="closeForm()">Отмена</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1100px; margin: 0 auto; }
    .page-title { margin: 0 0 2px; font-size: 22px; }
    .section-title { margin: 0; font-size: 16px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0 18px; }
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(15,23,42,.5);
      display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px;
    }
    .modal {
      background: #fff; border-radius: 12px; padding: 24px;
      width: 100%; max-width: 620px; max-height: 90vh; overflow-y: auto;
    }
    .modal-title { margin: 0; font-size: 18px; }
    @media (max-width: 700px) { .grid { grid-template-columns: 1fr; } }
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
  saving = false;
  error = '';

  showForm = false;
  form: MovementForm = emptyMovement();

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly warehouseService: WarehouseService,
    private readonly toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.fetchStock();
    this.fetchMovements();
  }

  fetchStock(): void {
    this.loading = true;
    this.warehouseService
      .stockItems()
      .pipe(takeUntilDestroyed(this.destroyRef))
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
    this.warehouseService
      .movements()
      .pipe(takeUntilDestroyed(this.destroyRef))
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

  openMovement(): void {
    this.form = emptyMovement();
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
  }

  saveMovement(): void {
    if (this.form.quantity === null || this.form.quantity === undefined) {
      this.error = 'Укажите количество';
      return;
    }
    this.saving = true;
    this.error = '';
    this.warehouseService
      .createMovement({
        date: this.form.date,
        type: this.form.type,
        itemName: this.form.itemName,
        quantity: Number(this.form.quantity),
        unit: this.form.unit,
        note: this.form.note,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving = false;
          this.showForm = false;
          this.toast.success('Движение добавлено');
          this.fetchMovements();
        },
        error: err => {
          this.saving = false;
          const message = err?.error?.error || 'Ошибка сохранения движения';
          this.error = message;
          this.toast.error(message);
        },
      });
  }

  stockClass(item: StockItem): string {
    if (item.currentStock <= item.minStock) return 'badge-red';
    if (item.currentStock <= item.minStock * 2) return 'badge-amber';
    return 'badge-green';
  }
}
