import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { inject, DestroyRef } from '@angular/core';
import { API_URL } from '../../core/api';
import { COMPANIES } from '../../core/constants';

interface InvoiceItem {
  itemName: string;
  quantity: number;
  price: number;
  sum: number;
}

interface Invoice {
  _id?: string;
  invoiceNumber: string;
  invoiceDate: string;
  supplier: string;
  invoiceType: string;
  company: string;
  items: InvoiceItem[];
  totalAmount: number;
  isPaid: boolean;
}

const emptyInvoice = (): Invoice => ({
  invoiceNumber: '',
  invoiceDate: new Date().toISOString().slice(0, 10),
  supplier: '',
  invoiceType: 'Основной',
  company: 'СИЮ',
  items: [{ itemName: '', quantity: 1, price: 0, sum: 0 }],
  totalAmount: 0,
  isPaid: false,
});

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="row-between mb-4">
        <div>
          <h1 class="page-title">Реестр счетов</h1>
          <p class="muted">Счета поставщиков и их оплата</p>
        </div>
        <button class="btn-primary" (click)="openCreate()">＋ Новый счёт</button>
      </div>

      <div class="alert alert-error" *ngIf="error">{{ error }}</div>
      <div class="alert alert-success" *ngIf="notice">{{ notice }}</div>

      <div class="card mb-4">
        <div class="filters">
          <select [(ngModel)]="filterPaid" (change)="fetch()">
            <option [value]="''">Все</option>
            <option [value]="true">Оплаченные</option>
            <option [value]="false">Не оплаченные</option>
          </select>
        </div>
      </div>

      <div class="table-wrap">
        <table class="data">
          <thead>
            <tr>
              <th>№ Счета</th>
              <th>Дата</th>
              <th>Поставщик</th>
              <th>Тип</th>
              <th class="num">Позиций</th>
              <th class="num">Итого</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of invoices">
              <td>{{ item.invoiceNumber }}</td>
              <td>{{ item.invoiceDate | date:'dd.MM.yyyy' }}</td>
              <td>{{ item.supplier }}</td>
              <td>{{ item.invoiceType }}</td>
              <td class="num">{{ item.items.length || 0 }}</td>
              <td class="num">{{ item.totalAmount | number:'1.2-2' }} ₽</td>
              <td>
                <span class="badge" [class]="item.isPaid ? 'badge-green' : 'badge-amber'">
                  {{ item.isPaid ? '✅ Оплачено' : '⏳ Ожидает' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="empty" *ngIf="!loading && invoices.length === 0">
          <div class="empty-title">Счетов пока нет</div>
          <div>Создайте первый счёт кнопкой выше</div>
        </div>
      </div>

      <div class="spinner" *ngIf="loading"></div>

      <div class="modal-backdrop" *ngIf="showForm" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="row-between mb-4">
            <h2 class="modal-title">Новый счёт</h2>
            <button class="btn-ghost" (click)="closeForm()">✕</button>
          </div>

          <form (ngSubmit)="save()">
            <div class="grid">
              <div class="field">
                <label>№ Счета *</label>
                <input [(ngModel)]="form.invoiceNumber" name="invoiceNumber" required />
              </div>
              <div class="field">
                <label>Дата *</label>
                <input [(ngModel)]="form.invoiceDate" name="invoiceDate" type="date" required />
              </div>
              <div class="field">
                <label>Поставщик</label>
                <input [(ngModel)]="form.supplier" name="supplier" list="suppliers" />
                <datalist id="suppliers">
                  <option *ngFor="let s of suppliers" [value]="s"></option>
                </datalist>
              </div>
              <div class="field">
                <label>Тип счёта</label>
                <select [(ngModel)]="form.invoiceType" name="invoiceType">
                  <option>Основной</option>
                  <option>Дополнительный</option>
                  <option>Возврат</option>
                </select>
              </div>
              <div class="field">
                <label>Компания</label>
                <select [(ngModel)]="form.company" name="company">
                  <option *ngFor="let c of companies" [value]="c">{{ c }}</option>
                </select>
              </div>
            </div>

            <h3 class="mb-2">Позиции счёта</h3>
            <div class="items">
              <div class="item-row" *ngFor="let line of form.items; let i = index">
                <input placeholder="Наименование" [(ngModel)]="line.itemName" [name]="'itemName' + i" />
                <input
                  type="number" min="0" step="0.01" placeholder="Кол-во"
                  [(ngModel)]="line.quantity" [name]="'qty' + i"
                  (input)="recalc(i)" class="num-input"
                />
                <input
                  type="number" min="0" step="0.01" placeholder="Цена"
                  [(ngModel)]="line.price" [name]="'price' + i"
                  (input)="recalc(i)" class="num-input"
                />
                <span class="muted line-sum">{{ line.sum | number:'1.2-2' }} ₽</span>
                <button type="button" class="btn-ghost" (click)="removeLine(i)" [disabled]="form.items.length === 1">✕</button>
              </div>
              <button type="button" class="btn-ghost" (click)="addLine()">＋ Добавить позицию</button>
            </div>

            <div class="row-between mt-2 mb-4">
              <span class="muted">Итого по счёту</span>
              <strong class="total">{{ form.totalAmount | number:'1.2-2' }} ₽</strong>
            </div>

            <label class="row mb-4" style="gap:8px">
              <input type="checkbox" [(ngModel)]="form.isPaid" name="isPaid" />
              <span>Счёт оплачен</span>
            </label>

            <div class="row">
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
    .filters { display: flex; gap: 10px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0 18px; }
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(15,23,42,.5);
      display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px;
    }
    .modal {
      background: #fff; border-radius: 12px; padding: 24px;
      width: 100%; max-width: 720px; max-height: 90vh; overflow-y: auto;
    }
    .modal-title { margin: 0; font-size: 18px; }
    .items { border: 1px solid var(--border); border-radius: 8px; padding: 12px; margin-bottom: 10px; }
    .item-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
    .item-row input:first-child { flex: 1 1 auto; }
    .num-input { width: 110px; }
    .line-sum { width: 110px; text-align: right; font-variant-numeric: tabular-nums; }
    .total { font-size: 17px; }
    @media (max-width: 700px) {
      .grid { grid-template-columns: 1fr; }
      .item-row { flex-wrap: wrap; }
    }
  `],
})
export class InvoicesComponent implements OnInit {
  invoices: Invoice[] = [];
  suppliers: string[] = [];
  readonly companies = COMPANIES;
  filterPaid = '';
  loading = false;
  saving = false;
  error = '';
  notice = '';

  showForm = false;
  form = emptyInvoice();

  constructor(private http: HttpClient) {}

  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.fetch();
    this.fetchSuppliers();
  }

  fetch(): void {
    this.loading = true;
    this.error = '';
    let params = new HttpParams();
    if (this.filterPaid !== '') params = params.set('isPaid', this.filterPaid);

    this.http
      .get<Invoice[]>(`${API_URL}/api/invoices`, { params })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => (this.invoices = data),
        error: () => (this.error = 'Не удалось загрузить счета'),
        complete: () => (this.loading = false),
      });
  }

  private fetchSuppliers(): void {
    this.http
      .get<{ name: string }[]>(`${API_URL}/api/dictionaries/Suppliers`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: all => (this.suppliers = [...new Set(all.map(d => d.name).filter(Boolean))].sort()),
      });
  }

  openCreate(): void {
    this.form = emptyInvoice();
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
  }

  addLine(): void {
    this.form.items.push({ itemName: '', quantity: 1, price: 0, sum: 0 });
  }

  removeLine(index: number): void {
    this.form.items.splice(index, 1);
    this.recalcTotal();
  }

  recalc(index: number): void {
    const line = this.form.items[index];
    line.sum = (Number(line.quantity) || 0) * (Number(line.price) || 0);
    this.recalcTotal();
  }

  private recalcTotal(): void {
    this.form.totalAmount = this.form.items.reduce((acc, l) => acc + l.sum, 0);
  }

  save(): void {
    this.saving = true;
    this.error = '';
    const payload = { ...this.form, totalAmount: this.form.totalAmount };

    this.http
      .post<Invoice>(`${API_URL}/api/invoices`, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving = false;
          this.showForm = false;
          this.notice = 'Счёт создан';
          setTimeout(() => (this.notice = ''), 3000);
          this.fetch();
        },
        error: err => {
          this.saving = false;
          this.error = err?.error?.error || 'Ошибка сохранения';
        },
      });
  }
}
