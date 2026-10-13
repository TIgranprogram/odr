import { Component, OnInit, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OrderService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';
import { Order } from '../../core/models';

interface OrderLine {
  itemTitle: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
}

interface OrderForm {
  orderNumber: string;
  customer: string;
  status: string;
  orderDate: string;
  note: string;
  items: OrderLine[];
}

const emptyLine = (): OrderLine => ({ itemTitle: '', quantity: 1, unit: 'шт', price: 0, total: 0 });

const emptyOrder = (): OrderForm => ({
  orderNumber: '',
  customer: '',
  status: 'В работе',
  orderDate: new Date().toISOString().slice(0, 10),
  note: '',
  items: [emptyLine()],
});

@Component({
  selector: 'app-orders',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="row-between mb-4">
        <div>
          <h1 class="page-title">Заказы / Спецификации</h1>
          <p class="muted">Реестр заказов и их суммы</p>
        </div>
        <button class="btn-primary" (click)="openCreate()">＋ Новый заказ</button>
      </div>

      @if (error) {
        <div class="alert alert-error">{{ error }}</div>
      }

      <div class="table-wrap">
        <table class="data">
          <thead>
            <tr>
              <th>№ Заказа</th>
              <th>Заказчик</th>
              <th>Статус</th>
              <th class="num">Позиций</th>
              <th class="num">Итого</th>
              <th>Дата</th>
            </tr>
          </thead>
          <tbody>
            @for (item of orders; track item) {
              <tr>
                <td>{{ item.orderNumber }}</td>
                <td>{{ item.customer }}</td>
                <td>
                  <span class="badge badge-blue">{{ item.status }}</span>
                </td>
                <td class="num">{{ item.items?.length || 0 }}</td>
                <td class="num">{{ item.totalAmount | number: '1.2-2' }} ₽</td>
                <td>{{ item.orderDate | date: 'dd.MM.yyyy' }}</td>
              </tr>
            }
          </tbody>
        </table>
        @if (!loading && orders.length === 0) {
          <div class="empty">
            <div class="empty-title">Заказов пока нет</div>
            <div>Создайте первый заказ кнопкой выше</div>
          </div>
        }
      </div>

      @if (loading) {
        <div class="spinner"></div>
      }

      @if (showForm) {
        <div class="modal-backdrop" (click)="closeForm()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="row-between mb-4">
              <h2 class="modal-title">Новый заказ</h2>
              <button class="btn-ghost" aria-label="Закрыть" (click)="closeForm()">✕</button>
            </div>
            <form (ngSubmit)="save()">
              <div class="grid">
                <div class="field">
                  <label>№ Заказа *</label>
                  <input [(ngModel)]="form.orderNumber" name="orderNumber" required />
                </div>
                <div class="field">
                  <label>Заказчик *</label>
                  <input [(ngModel)]="form.customer" name="customer" required />
                </div>
                <div class="field">
                  <label>Дата</label>
                  <input [(ngModel)]="form.orderDate" name="orderDate" type="date" />
                </div>
                <div class="field">
                  <label>Статус</label>
                  <select [(ngModel)]="form.status" name="status">
                    <option>В работе</option>
                    <option>Выполнен</option>
                    <option>Отменён</option>
                  </select>
                </div>
              </div>
              <h3 class="mb-2">Спецификация</h3>
              <div class="items">
                @for (line of form.items; track line; let i = $index) {
                  <div class="item-row">
                    <input
                      placeholder="Наименование"
                      [(ngModel)]="line.itemTitle"
                      [name]="'title' + i"
                    />
                    <input
                      class="num-input"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Кол-во"
                      [(ngModel)]="line.quantity"
                      [name]="'q' + i"
                      (input)="recalc(i)"
                    />
                    <input
                      class="unit-input"
                      placeholder="Ед."
                      [(ngModel)]="line.unit"
                      [name]="'u' + i"
                    />
                    <input
                      class="num-input"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Цена"
                      [(ngModel)]="line.price"
                      [name]="'p' + i"
                      (input)="recalc(i)"
                    />
                    <span class="muted line-sum">{{ line.total | number: '1.2-2' }} ₽</span>
                    <button
                      type="button"
                      class="btn-ghost"
                      aria-label="Удалить позицию"
                      (click)="removeLine(i)"
                      [disabled]="form.items.length === 1"
                    >
                      ✕
                    </button>
                  </div>
                }
                <button type="button" class="btn-ghost" (click)="addLine()">
                  ＋ Добавить позицию
                </button>
              </div>
              <div class="row-between mt-2 mb-4">
                <span class="muted">Итого по заказу</span>
                <strong class="total">{{ totalAmount | number: '1.2-2' }} ₽</strong>
              </div>
              <div class="row">
                <button type="submit" class="btn-primary" [disabled]="saving">
                  {{ saving ? 'Сохранение…' : 'Сохранить' }}
                </button>
                <button type="button" (click)="closeForm()">Отмена</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [
    `
      .page {
        max-width: 1100px;
        margin: 0 auto;
      }
      .page-title {
        margin: 0 0 2px;
        font-size: 22px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0 18px;
      }
      .items {
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 10px;
      }
      .item-row {
        display: flex;
        gap: 8px;
        align-items: center;
        margin-bottom: 8px;
      }
      .item-row input:first-child {
        flex: 1 1 auto;
      }
      .num-input {
        width: 100px;
      }
      .unit-input {
        width: 70px;
      }
      .line-sum {
        width: 100px;
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
      .total {
        font-size: 17px;
      }
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        padding: 20px;
      }
      .modal {
        background: #fff;
        border-radius: 12px;
        padding: 24px;
        width: 100%;
        max-width: 760px;
        max-height: 90vh;
        overflow-y: auto;
      }
      .modal-title {
        margin: 0;
        font-size: 18px;
      }
      @media (max-width: 700px) {
        .grid {
          grid-template-columns: 1fr;
        }
        .item-row {
          flex-wrap: wrap;
        }
      }
    `,
  ],
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  loading = false;
  saving = false;
  error = '';

  showForm = false;
  form: OrderForm = emptyOrder();

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly orderService: OrderService,
    private readonly toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.fetch();
  }

  get totalAmount(): number {
    return this.form.items.reduce((acc, l) => acc + (Number(l.total) || 0), 0);
  }

  fetch(): void {
    this.loading = true;
    this.error = '';
    this.orderService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => (this.orders = data),
        error: () => (this.error = 'Не удалось загрузить заказы'),
        complete: () => (this.loading = false),
      });
  }

  openCreate(): void {
    this.form = emptyOrder();
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
  }

  addLine(): void {
    this.form.items.push(emptyLine());
  }

  removeLine(index: number): void {
    this.form.items.splice(index, 1);
  }

  recalc(index: number): void {
    const line = this.form.items[index];
    line.total = (Number(line.quantity) || 0) * (Number(line.price) || 0);
  }

  save(): void {
    this.saving = true;
    this.error = '';
    const payload: Partial<Order> & { items: OrderLine[] } = {
      orderNumber: this.form.orderNumber,
      customer: this.form.customer,
      status: this.form.status,
      orderDate: this.form.orderDate,
      totalAmount: this.totalAmount,
      items: this.form.items.map((l) => ({
        ...l,
        total: (Number(l.quantity) || 0) * (Number(l.price) || 0),
      })),
    };

    this.orderService
      .create(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving = false;
          this.showForm = false;
          this.toast.success('Заказ создан');
          this.fetch();
        },
        error: (err) => {
          this.saving = false;
          const message = err?.error?.error || 'Ошибка сохранения заказа';
          this.error = message;
          this.toast.error(message);
        },
      });
  }
}
