import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DictionaryService } from '../../core/services/dictionary.service';
import { ToastService } from '../../core/services/toast.service';
import { DICTIONARY_CATEGORIES, DICTIONARY_LABELS } from '../../core/constants';
import { DictionaryItem } from '../../core/models';

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
                <button class="btn-ghost" title="Редактировать" aria-label="Редактировать запись" (click)="startEdit(item)">✏️</button>
                <button class="btn-ghost" title="Удалить" aria-label="Удалить запись" (click)="remove(item)">🗑️</button>
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

  editingId = '';
  form: DictionaryItem = { category: 'Types', name: '', value: '' };

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly dictionaryService: DictionaryService,
    private readonly toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.fetch();
  }

  fetch(): void {
    this.loading = true;
    this.error = '';
    this.dictionaryService
      .list(this.selectedCategory || undefined)
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
      ? this.dictionaryService.update(this.editingId, this.form)
      : this.dictionaryService.create(this.form);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving = false;
        this.toast.success(this.editingId ? 'Запись обновлена' : 'Запись добавлена');
        this.resetForm();
        this.fetch();
      },
      error: err => {
        this.saving = false;
        const message = err?.error?.error || 'Ошибка сохранения';
        this.error = message;
        this.toast.error(message);
      },
    });
  }

  remove(item: DictionaryItem): void {
    if (!confirm(`Удалить «${item.name}»?`)) return;
    this.dictionaryService
      .remove(item._id ?? '')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.items = this.items.filter(i => i._id !== item._id);
          this.toast.success('Запись удалена');
        },
        error: err => {
          const message = err?.error?.error || 'Ошибка удаления';
          this.error = message;
          this.toast.error(message);
        },
      });
  }

  categoryLabel(category: string): string {
    return DICTIONARY_LABELS[category] ?? category;
  }
}
