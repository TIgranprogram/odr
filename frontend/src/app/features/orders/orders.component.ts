import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { API_URL } from '../../core/api';

interface Order {
  _id?: string;
  orderNumber: string;
  customer: string;
  status: string;
  totalAmount: number;
  orderDate?: string;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="row-between mb-4">
        <div>
          <h1 class="page-title">Заказы / Спецификации</h1>
          <p class="muted">Реестр заказов и их суммы</p>
        </div>
      </div>

      <div class="alert alert-error" *ngIf="error">{{ error }}</div>

      <div class="table-wrap">
        <table class="data">
          <thead>
            <tr>
              <th>№ Заказа</th>
              <th>Заказчик</th>
              <th>Статус</th>
              <th class="num">Итого</th>
              <th>Дата</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of orders">
              <td>{{ item.orderNumber }}</td>
              <td>{{ item.customer }}</td>
              <td><span class="badge badge-blue">{{ item.status }}</span></td>
              <td class="num">{{ item.totalAmount | number:'1.2-2' }} ₽</td>
              <td>{{ item.orderDate | date:'dd.MM.yyyy' }}</td>
            </tr>
          </tbody>
        </table>
        <div class="empty" *ngIf="!loading && orders.length === 0">
          <div class="empty-title">Заказов пока нет</div>
          <div>Заказы появятся после их создания в системе</div>
        </div>
      </div>

      <div class="spinner" *ngIf="loading"></div>
    </div>
  `,
  styles: [`
    .page { max-width: 1100px; margin: 0 auto; }
    .page-title { margin: 0 0 2px; font-size: 22px; }
  `],
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  loading = false;
  error = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loading = true;
    this.http
      .get<Order[]>(`${API_URL}/api/orders`)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: data => (this.orders = data),
        error: err => (this.error = err?.status === 404 ? 'Эндпоинт заказов ещё не подключён на сервере' : 'Не удалось загрузить заказы'),
        complete: () => (this.loading = false),
      });
  }
}
