import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h1 class="title">Заказы / Спецификации</h1>
      <div class.table-container">
        <table class_table>
          <thead>
            <tr>
              <th>№ Заказа</th>
              <th>Заказчик</th>
              <th>Статус</th>
              <th>Итого</th>
              <th>Дата</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of orders">
              <td>{{item.orderNumber}}</td>
              <td>{{item.customer}}</td>
              <td>{{item.status}}</td>
              <td>{{item.totalAmount | number:'1.2-2'}} ₽</td>
              <td>{{item.orderDate | date:'dd.MM.yyyy'}}</td>
            </tr>
          </</tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 20px; }
    .table-container { overflow-x: auto; }
    .table_table { width: 100%; border-collapse: collapse; }
    .table_table th, .table_table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    .table_table th { background: #f4f4f4; }
  `]
})
export class OrderComponent {
  orders: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any[]>('http://localhost:3000/api/orders').subscribe(data => this.orders = data);
  }
}
