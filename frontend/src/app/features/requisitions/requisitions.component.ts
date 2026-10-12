import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { API_URL } from '../../core/api';
import { STATUSES, PRIORITIES } from '../../core/constants';

interface Requisition {
  _id?: string;
  category: string;
  itemName: string;
  quantity: number;
  unit: string;
  supplier: string;
  customer: string;
  company: string;
  priority: string;
  status: string;
  priceWithVat: number;
  date?: string;
  requestedBy?: string;
}

@Component({
  selector: 'app-requisitions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="row-between mb-4">
        <div>
          <h1 class="page-title">Панель снабжения — Заявки</h1>
          <p class="muted">Создание и контроль заявок на закупку</p>
        </div>
        <button class="btn-primary" (click)="openCreate()">＋ Новая заявка</button>
      </div>

      <div class="alert alert-error" *ngIf="error">{{ error }}</div>
      <div class="alert alert-success" *ngIf="notice">{{ notice }}</div>

      <div class="card mb-4">
        <div class="filters">
          <input
            class="grow"
            type="text"
            placeholder="Поиск по наименованию, артикулу, поставщику…"
            [(ngModel)]="filters.search"
            (input)="fetch()"
          />
          <select [(ngModel)]="filters.status" (change)="fetch()">
            <option value="">Все статусы</option>
            <option *ngFor="let s of statuses" [value]="s">{{ s }}</option>
          </select>
          <select [(ngModel)]="filters.customer" (change)="fetch()">
            <option value="">Все заказчики</option>
            <option *ngFor="let c of customers" [value]="c">{{ c }}</option>
          </select>
        </div>
      </div>

      <div class="table-wrap">
        <table class="data">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Наименование</th>
              <th class="num">Кол-во</th>
              <th>Поставщик</th>
              <th>Заказчик</th>
              <th>Статус</th>
              <th class="num">Сумма с НДС</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of items">
              <td>{{ item.date | date:'dd.MM.yyyy' }}</td>
              <td>
                <div>{{ item.itemName }}</div>
                <div class="muted" style="font-size:12px">{{ item.category }}</div>
              </td>
              <td class="num">{{ item.quantity }} {{ item.unit }}</td>
              <td>{{ item.supplier }}</td>
              <td>{{ item.customer }}</td>
              <td><span class="badge" [class]="statusClass(item.status)">{{ item.status }}</span></td>
              <td class="num">{{ item.priceWithVat * item.quantity | number:'1.2-2' }} ₽</td>
              <td>
                <button class="btn-ghost" title="Редактировать" (click)="openEdit(item)">✏️</button>
                <button class="btn-ghost" title="Удалить" (click)="remove(item)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="empty" *ngIf="!loading && items.length === 0">
          <div class="empty-title">Заявок пока нет</div>
          <div>Создайте первую заявку кнопкой выше</div>
        </div>
      </div>

      <div class="spinner" *ngIf="loading"></div>

      <!-- Модальное окно создания / редактирования -->
      <div class="modal-backdrop" *ngIf="showForm" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="row-between mb-4">
            <h2 class="modal-title">{{ editingId ? 'Редактировать заявку' : 'Новая заявка' }}</h2>
            <button class="btn-ghost" (click)="closeForm()">✕</button>
          </div>

          <form (ngSubmit)="save()">
            <div class="grid">
              <div class="field">
                <label>Категория *</label>
                <select [(ngModel)]="form.category" name="category" required>
                  <option value="" disabled>Выберите…</option>
                  <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
                </select>
              </div>
              <div class="field">
                <label>Наименование *</label>
                <input [(ngModel)]="form.itemName" name="itemName" required />
              </div>
              <div class="field">
                <label>Количество *</label>
                <input [(ngModel)]="form.quantity" name="quantity" type="number" min="0" step="0.01" required />
              </div>
              <div class="field">
                <label>Ед. изм.</label>
                <select [(ngModel)]="form.unit" name="unit">
                  <option *ngFor="let u of units" [value]="u">{{ u }}</option>
                </select>
              </div>
              <div class="field">
                <label>Поставщик</label>
                <input [(ngModel)]="form.supplier" name="supplier" list="suppliers" />
                <datalist id="suppliers">
                  <option *ngFor="let s of suppliers" [value]="s"></option>
                </datalist>
              </div>
              <div class="field">
                <label>Заказчик *</label>
                <input [(ngModel)]="form.customer" name="customer" list="customers" required />
                <datalist id="customers">
                  <option *ngFor="let c of customers" [value]="c"></option>
                </datalist>
              </div>
              <div class="field">
                <label>Компания</label>
                <select [(ngModel)]="form.company" name="company">
                  <option>СИЮ</option>
                  <option>ССЮ</option>
                </select>
              </div>
              <div class="field">
                <label>Приоритет</label>
                <select [(ngModel)]="form.priority" name="priority">
                  <option *ngFor="let p of priorities" [value]="p">{{ p }}</option>
                </select>
              </div>
              <div class="field">
                <label>Цена с НДС (за ед.) *</label>
                <input [(ngModel)]="form.priceWithVat" name="priceWithVat" type="number" min="0" step="0.01" required />
              </div>
              <div class="field">
                <label>Статус</label>
                <select [(ngModel)]="form.status" name="status">
                  <option *ngFor="let s of statuses" [value]="s">{{ s }}</option>
                </select>
              </div>
            </div>

            <div class="row mt-2">
              <button type="submit" class="btn-primary" [disabled]="saving">
                {{ saving ? 'Сохранение…' : 'Сохранить' }}
              </button>
              <button type="button" (click)="closeForm()">Отмена</button>
              <span class="grow"></span>
              <span class="muted">Сумма: {{ form.priceWithVat * form.quantity | number:'1.2-2' }} ₽</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1200px; margin: 0 auto; }
    .page-title { margin: 0 0 2px; font-size: 22px; }
    .filters { display: flex; gap: 10px; }
    .filters input { max-width: 340px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0 18px; }
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(15,23,42,.5);
      display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px;
    }
    .modal {
      background: #fff; border-radius: 12px; padding: 24px;
      width: 100%; max-width: 760px; max-height: 90vh; overflow-y: auto;
    }
    .modal-title { margin: 0; font-size: 18px; }
    @media (max-width: 700px) {
      .grid { grid-template-columns: 1fr; }
      .filters { flex-direction: column; }
      .filters input { max-width: none; }
    }
  `],
})
export class RequisitionsComponent implements OnInit {
  items: Requisition[] = [];
  loading = false;
  saving = false;
  error = '';
  notice = '';

  categories: string[] = [];
  units: string[] = [];
  suppliers: string[] = [];
  customers: string[] = [];
  readonly statuses = STATUSES;
  readonly priorities = PRIORITIES;

  filters = { search: '', status: '', customer: '' };

  showForm = false;
  editingId = '';
  form: Requisition = emptyRequisition();

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetch();
    this.fetchDictionaries();
  }

  fetch(): void {
    this.loading = true;
    this.error = '';
    let params = new HttpParams();
    if (this.filters.search) params = params.set('search', this.filters.search);
    if (this.filters.status) params = params.set('status', this.filters.status);
    if (this.filters.customer) params = params.set('customer', this.filters.customer);

    this.http
      .get<Requisition[]>(`${API_URL}/api/requisitions`, { params })
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: data => (this.items = data),
        error: () => (this.error = 'Не удалось загрузить заявки'),
        complete: () => (this.loading = false),
      });
  }

  private fetchDictionaries(): void {
    this.http
      .get<{ category: string; name: string; value: string }[]>(`${API_URL}/api/dictionaries`)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: all => {
          this.categories = unique(all.filter(d => d.category === 'Types').map(d => d.name));
          this.units = unique(all.filter(d => d.category === 'Units').map(d => d.name));
          this.suppliers = unique(all.filter(d => d.category === 'Suppliers').map(d => d.name));
          this.customers = unique(all.filter(d => d.category === 'Customers').map(d => d.name));
        },
      });
  }

  openCreate(): void {
    this.editingId = '';
    this.form = emptyRequisition();
    this.showForm = true;
  }

  openEdit(item: Requisition): void {
    this.editingId = item._id ?? '';
    this.form = { ...item };
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
  }

  save(): void {
    this.saving = true;
    this.error = '';
    const payload = { ...this.form };
    const request = this.editingId
      ? this.http.put<Requisition>(`${API_URL}/api/requisitions/${this.editingId}`, payload)
      : this.http.post<Requisition>(`${API_URL}/api/requisitions`, payload);

    request.pipe(takeUntilDestroyed()).subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.notice = this.editingId ? 'Заявка обновлена' : 'Заявка создана';
        setTimeout(() => (this.notice = ''), 3000);
        this.fetch();
      },
      error: err => {
        this.saving = false;
        this.error = err?.error?.error || 'Ошибка сохранения';
      },
    });
  }

  remove(item: Requisition): void {
    if (!confirm(`Удалить заявку «${item.itemName}»?`)) return;
    this.http
      .delete(`${API_URL}/api/requisitions/${item._id}`)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: () => {
          this.items = this.items.filter(i => i._id !== item._id);
          this.notice = 'Заявка удалена';
          setTimeout(() => (this.notice = ''), 3000);
        },
        error: err => (this.error = err?.error?.error || 'Ошибка удаления'),
      });
  }

  statusClass(status: string): string {
    if (status.includes('Ожидает')) return 'badge-amber';
    if (status.includes('Заказать')) return 'badge-blue';
    if (status.includes('Оплачено')) return 'badge-green';
    if (status.includes('Получено')) return 'badge-green';
    if (status.includes('Отменено')) return 'badge-red';
    return 'badge-slate';
  }
}

function emptyRequisition(): Requisition {
  return {
    category: '',
    itemName: '',
    quantity: 1,
    unit: 'шт',
    supplier: '',
    customer: '',
    company: 'СИЮ',
    priority: 'Обычный',
    status: '⏳ Ожидает',
    priceWithVat: 0,
  };
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}
