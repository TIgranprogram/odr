import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { inject, DestroyRef } from '@angular/core';
import { API_URL } from '../../core/api';
import { DICTIONARY_CATEGORIES } from '../../core/constants';

interface DictionaryItem {
  _id?: string;
  category: string;
  name: string;
  value: string;
  isActive?: boolean;
}

@Component({
  selector: 'app-dictionaries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="row-between mb-4">
        <div>
          <h1 class="page-title">Справочники</h1>
          <p class="muted">Категории, единицы измерения, поставщики, заказчики</p>
        </div>
      </div>

      <div class="alert alert-error" *ngIf="error">{{ error }}</div>
      <div class="alert alert-success" *ngIf="notice">{{ notice }}</div>

      <div class="card mb-4">
        <div class="filters">
          <select [(ngModel)]="selectedCategory" (change)="fetch()">
            <option value="">Все категории</option>
            <option *ngFor="let cat of categories" [value]="cat">{{ categoryLabel(cat) }}</option>
          </select>
        </div>
      </div>

      <div class="table-wrap mb-4">
        <table class="data">
          <thead>
            <tr>
              <th>Категория</th>
              <th>Наименование</th>
              <th>Значение</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of items">
              <td><span class="badge badge-slate">{{ categoryLabel(item.category) }}</span></td>
              <td>{{ item.name }}</td>
              <td class="muted">{{ item.value }}</td>
              <td class="text-right">
                <button class="btn-ghost" title="Редактировать" (click)="startEdit(item)">✏️</button>
                <button class="btn-ghost" title="Удалить" (click)="remove(item)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="empty" *ngIf="!loading && items.length === 0">
          <div class="empty-title">Записей нет</div>
          <div>Добавьте первую запись ниже</div>
        </div>
      </div>

      <div class="spinner" *ngIf="loading"></div>

      <div class="card">
        <h3 class="mb-4">{{ editingId ? 'Редактировать запись' : 'Новая запись' }}</h3>
        <form (ngSubmit)="save()">
          <div class="grid">
            <div class="field">
              <label>Категория *</label>
              <select [(ngModel)]="form.category" name="category" required>
                <option value="" disabled>Выберите…</option>
                <option *ngFor="let c of categories" [value]="c">{{ categoryLabel(c) }}</option>
              </select>
            </div>
            <div class="field">
              <label>Наименование *</label>
              <input [(ngModel)]="form.name" name="name" required />
            </div>
            <div class="field">
              <label>Значение</label>
              <input [(ngModel)]="form.value" name="value" />
            </div>
          </div>
          <div class="row">
            <button type="submit" class="btn-primary" [disabled]="saving">
              {{ saving ? 'Сохранение…' : editingId ? 'Обновить' : 'Добавить' }}
            </button>
            <button type="button" (click)="resetForm()" *ngIf="editingId">Отмена</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1000px; margin: 0 auto; }
    .page-title { margin: 0 0 2px; font-size: 22px; }
    .filters { display: flex; gap: 10px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0 18px; }
    @media (max-width: 700px) { .grid { grid-template-columns: 1fr; } }
  `],
})
export class DictionariesComponent implements OnInit {
  items: DictionaryItem[] = [];
  readonly categories = DICTIONARY_CATEGORIES;
  selectedCategory = '';
  loading = false;
  saving = false;
  error = '';
  notice = '';

  editingId = '';
  form: DictionaryItem = { category: 'Types', name: '', value: '' };

  constructor(private http: HttpClient) {}

  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.fetch();
  }

  fetch(): void {
    this.loading = true;
    this.error = '';
    const url = this.selectedCategory
      ? `${API_URL}/api/dictionaries/${encodeURIComponent(this.selectedCategory)}`
      : `${API_URL}/api/dictionaries`;

    this.http
      .get<DictionaryItem[]>(url)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => (this.items = data),
        error: () => (this.error = 'Не удалось загрузить справочник'),
        complete: () => (this.loading = false),
      });
  }

  startEdit(item: DictionaryItem): void {
    this.editingId = item._id ?? '';
    this.form = { ...item };
  }

  resetForm(): void {
    this.editingId = '';
    this.form = { category: 'Types', name: '', value: '' };
  }

  save(): void {
    this.saving = true;
    this.error = '';
    const request = this.editingId
      ? this.http.put<DictionaryItem>(`${API_URL}/api/dictionaries/${this.editingId}`, this.form)
      : this.http.post<DictionaryItem>(`${API_URL}/api/dictionaries`, this.form);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving = false;
        this.notice = this.editingId ? 'Запись обновлена' : 'Запись добавлена';
        setTimeout(() => (this.notice = ''), 3000);
        this.resetForm();
        this.fetch();
      },
      error: err => {
        this.saving = false;
        this.error = err?.error?.error || 'Ошибка сохранения';
      },
    });
  }

  remove(item: DictionaryItem): void {
    if (!confirm(`Удалить «${item.name}»?`)) return;
    this.http
      .delete(`${API_URL}/api/dictionaries/${item._id}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.items = this.items.filter(i => i._id !== item._id);
          this.notice = 'Запись удалена';
          setTimeout(() => (this.notice = ''), 3000);
        },
        error: err => (this.error = err?.error?.error || 'Ошибка удаления'),
      });
  }

  categoryLabel(category: string): string {
    const labels: Record<string, string> = {
      Types: 'Типы товаров',
      Units: 'Единицы измерения',
      Suppliers: 'Поставщики',
      Customers: 'Заказчики',
    };
    return labels[category] ?? category;
  }
}
