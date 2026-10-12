import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class.container">
      <h1 class="title">Реестр счетов</h1>
      <div class.table-container">
        <table class_table>
          <thead>
            <tr>
              <th>№ Счета</th>
              <th>Дата</th>
              <th>Поставщик</th>
              <th>Тип счета</th>
              <th>Итог</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of invoices">
              <td>{{item.invoiceNumber}}</td>
              <td>{{item.invoiceDate | date:'dd.MM.yyyy'}}</td>
              <td>{{item.supplier}}</td>
              <td>{{item.invoiceType}}</td>
              <td>{{item.totalAmount | number:'1.2-2'}} ₽</td>
              <td>
                <span [class]="item.isPaid ? 'status-paid' : 'status-pending'">
                  {{item.isPaid ? '✅ Оплачено' : '⏳ Ожидает'}}
                </span>
              </td>
            </tr>
          </tbody>
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
    .status-paid { color: green; font-weight: bold; }
    .status-pending { color: orange; }
  `]
})
export class InvoicesComponent {
  invoices: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any[]>('http://localhost:3000/api/invoices').subscribe(data => this.invoices = data);
  }
}
