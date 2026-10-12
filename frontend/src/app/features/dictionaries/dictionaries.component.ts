import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as DictionaryService from '../services/dictionary.service';

@Component({
  selector: 'app-dictionaries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h1>Справочники</h1>
      <div class="filter-bar">
        <select [(ngModel)]="selectedCategory" (change)="fetchByCategory()">
          <option value="">Все категории</option>
          <option *ngFor="let cat of categories" [value]="cat">{{cat}}</option>
        </select>
      </div>

      <div class="table-container">
        <table class_table>
          <thead>
            <tr>
              <th>Категория</th>
              <th>Наименование</th>
              <th>Значение</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of items">
              <td>{{item.category}}</td>
              <td>{{item.name}}</td>
              <td>{{item.value}}</td>
              <td>
                <button (click)="editItem(item)">✏️</button>
                <button (click)="deleteItem(item._id)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="add-form">
        <h3>Добавить запись</h3>
        <input [(ngModel)]="newItem.name" placeholder="Наименование" />
        <select [(ngModel)]="newItem.category">
          <option *ngFor="let c of categories" [value]="c">{{c}}</option>
        </select>
        <input [(ngModel)]="newItem.value" placeholder="Значение" />
        <button (click)="addItem()">Добавить</button>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 20px; }
    .filter-bar { margin-bottom: 20px; }
    .table-container { overflow-x: auto; }
    .table_table { width: 100%; border-collapse: collapse; }
    .table_table th, .table_table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    .table_table th { background: #f4f4f4; }
    .add-form { margin-top: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
    input, select { margin-right: 10px; padding: 8px; }
    button { padding: 8px 16px; cursor: pointer; }
  `]
})
export class DictionariesComponent implements OnInit {
  items: any[] = [];
  categories: string[] = ['Оборудование', 'Покупные изделия', 'Расходники', 'Метизы', 'Услуги'];
  selectedCategory = '';
  newItem: any = { name: '', category: '', value: '' };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchItems();
  }

  fetchItems() {
    const url = this.selectedCategory ? `http://localhost:3000/api/dictionaries/${this.selectedCategory}` : `http://localhost:3000/api/dictionaries`;
    this.http.get<any[]>(url).subscribe(data => this.items = data);
  }

  fetchByCategory() {
    this.fetchItems();
  }

  addItem() {
    this.http.post('http://localhost:3000/api/dictionaries', this.newItem).subscribe(() => {
      this.items = [];
      this.fetchItems();
    });
  }

  deleteItem(id: string) {
    this.http.delete(`http://localhost:3000/api/dictionaries/${id}`).subscribe(() => {
      this.items = this.items.filter(i => i._id !== id);
    });
  }

  editItem(item: any) {
    this.newItem = { ...item };
  }
}
