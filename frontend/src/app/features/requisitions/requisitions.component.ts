import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-requisitions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h1 class.title>Панель Снабжения (Заявки)</h1>
      
      <div class="actions">
        <button (click)="showCreateForm = !showCreateForm" class="btn-primary">Создать заявку</button>
      </div>

      <div class="filters">
        <input type="text" placeholder="Поиск..." [(ngModel)]="filters.search" (input)="fetchRequisitions()">
        <select [(ngModel)]="filters.status" (change)="fetchRequisitions()">
          <option value="">Все статусы</option>
          <option value="⏳ Ожидает">⏳ Ожидает</option>
          <option value="✅ Заказать">✅ Заказать</option>
          <option value="💰 Оплачено">💰 Оплачено</option>
          <option value="⚙️ В работе">⚙. В работе</option>
          <option value="☑️ Получено">☑️ Получено</option>
          <option value="Отменено">Отменено</option>
        </select>
      </div>

      <div class="table-container">
        <table class_table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Наименование</th>
              <th>Кол-во</th>
              <th>Поставщик</th>
              <th>Статус</th>
              <th>Сумма</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of requisitions">
              <td>{{item.date | date:'dd.MM.yyyy'}}</td>
              <td>{{item.itemName}}</td>
              <td>{{item.quantity}} {{item.unit}}</td>
              <td>{{item.supplier}}</td>
              <td><span class="status-badge">{{item.status}}</span></td>
              <td>{{item.priceWithVat | number:'1.2-2'}} ₽</td>
              <td>
                <button (click)="editRequisition(item)">✏️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class.modal *ngIf="showCreateForm">
        <div class.modal-content>
          <h3 class="modal-title">Создать новую заявку</h3>
          <form (submit)="createRequisition()">
            <input [(ngModel)]="newReq.itemName" name="itemName" placeholder="Наименование позиции" required />
            <input [(ngModel)]="newReq.quantity" name="quantity" type="number" placeholder="Кол-во" required />
            <input [(ngModel)]="newReq.unit" name="unit" placeholder="Ед. изм." />
            <input [(ngModel)]="newReq.supplier" name="supplier" placeholder="Поставщик" />
            <input [(ngModel)]="newReq.customer" name="customer" placeholder="Заказчик" />
            <input [(ngModel)]="newReq.priceWithVat" name="priceWithVat" type="number" placeholder="Цена с НДС" />
            <select [(ngModel)]="newReq.status" name="status">
              <option value="⏳ Ожидает">⏳ Ожидает</option>
              <option value="✅ Заказать">✅ Заказать</option>
              <option value="⚙️ В работе">⚙️ В работе</option>
              <option value="☑️ Получено">☑️ Получено</option>
            </select>
            <button type="submit" class="btn-primary">Сохранить</button>
            <button type="button" (click)="showCreateForm = false">Отмена</button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 20px; }
    .title { margin-bottom: 20px; }
    .actions { margin-bottom: 20px; }
    .btn-primary { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
    .filters { margin-bottom: 20px; display: flex; gap: 10px; }
    .filters input, .filters select { padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
    .table-container { overflow-x: auto; }
    .table_table { width: 100%; border-collapse: collapse; }
    .table_table th, .table_table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    .table_table th { background: #f4f4f4; }
    .status-badge { padding: 4px 8px; border-radius: 12px; font-size: 0.8em; }
    .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; }
    .modal-content { background: white; padding: 30px; border-radius: 8px; width: 500px; }
    .modal-title { margin-bottom: 20px; }
    .modal-content input, .modal-content select { width: 100%; margin-bottom: 15px; padding: 8px; }
  `]
})
export class RequisitionsComponent {
  requisitions: any[] = [];
  showCreateForm = false;
  filters = { search: '', status: '' };
  newReq: any = {
    itemName: '',
    quantity: 1,
    unit: 'шт',
    supplier: '',
    customer: '',
    priceWithVat: 0,
    status: '⏳ Ожидает'
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchRequisitions();
  }

  fetchRequisitions() {
    let url = `http://localhost:3000/api/requisitions?`;
    let params = [];
    if (this.filters.search) params.push(`search=${this.filters.search}`);
    if (this.filters.status) params.push(`status=${this.filters.status}`);
    
    this.http.get(`http://localhost:3000/api/requisitions?${params.join('&')}`)
      .subscribe(data => this.requisitions = data);
  }

  createRequisition() {
    this.http.post('http://localhost:3000/api/requisitions', this.newReq).subscribe(() => {
      this.showCreateForm = false;
      this.fetchRequisitions();
    });
  }

  editRequisition(item: any) {
    this.newReq = { ...item };
    this.showCreateForm = true;
  }
}
