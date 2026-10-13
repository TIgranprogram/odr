import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OdrService } from '../../core/services/odr.service';
import { AdditionalIncomeService } from '../../core/services/additional-income.service';
import { ToastService } from '../../core/services/toast.service';
import { INCOME_CATEGORIES } from '../../core/constants';
import { AdditionalIncome, OdrReport } from '../../core/models';

@Component({
  selector: 'app-odr',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="row-between mb-4">
        <div>
          <h1 class="page-title">Отчёт о доходах и расходах (ОДР)</h1>
          <p class="muted">Финансовый результат за выбранный период</p>
        </div>
        <div class="row">
          <input type="date" [(ngModel)]="start" (change)="fetch()" />
          <span class="muted">—</span>
          <input type="date" [(ngModel)]="end" (change)="fetch()" />
          <button (click)="setPeriod('month')">Текущий месяц</button>
          <button (click)="setPeriod('quarter')">Квартал</button>
          <button (click)="setPeriod('year')">Год</button>
        </div>
      </div>

      <div class="alert alert-error" *ngIf="error">{{ error }}</div>

      <div class="summary-grid mb-4">
        <div class="card stat">
          <div class="stat-label">Доходы</div>
          <div class="stat-value income">{{ report.totalIncome | number:'1.2-2' }} ₽</div>
        </div>
        <div class="card stat">
          <div class="stat-label">Расходы</div>
          <div class="stat-value expense">{{ report.totalExpense | number:'1.2-2' }} ₽</div>
        </div>
        <div class="card stat">
          <div class="stat-label">Чистая прибыль</div>
          <div class="stat-value" [class.income]="report.net >= 0" [class.expense]="report.net < 0">
            {{ report.net | number:'1.2-2' }} ₽
          </div>
        </div>
      </div>

      <div class="card mb-4">
        <div class="row-between mb-4">
          <div>
            <h3>Прочие поступления</h3>
            <p class="muted">Доходы, не связанные со счётом. Входят в «Доходы» за период.</p>
          </div>
          <div class="muted">Итого за период: {{ periodIncomesTotal | number:'1.2-2' }} ₽</div>
        </div>

        <div class="table-wrap mb-4">
          <table class="data">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Категория</th>
                <th class="text-right">Сумма</th>
                <th>Примечание</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of periodIncomes">
                <td>{{ item.date | date:'dd.MM.yyyy' }}</td>
                <td><span class="badge badge-slate">{{ item.category }}</span></td>
                <td class="text-right">{{ item.amount | number:'1.2-2' }} ₽</td>
                <td class="muted">{{ item.note }}</td>
                <td class="text-right">
                  <button class="btn-ghost" title="Редактировать" aria-label="Редактировать поступление" (click)="startEditIncome(item)">✏️</button>
                  <button class="btn-ghost" title="Удалить" aria-label="Удалить поступление" (click)="removeIncome(item)">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="empty" *ngIf="!loadingIncomes && periodIncomes.length === 0">
            <div class="empty-title">Поступлений за период нет</div>
            <div>Добавьте поступление ниже</div>
          </div>
        </div>

        <form (ngSubmit)="saveIncome()">
          <div class="grid">
            <div class="field">
              <label>Дата *</label>
              <input type="date" [(ngModel)]="incomeForm.date" name="date" required />
            </div>
            <div class="field">
              <label>Категория *</label>
              <select [(ngModel)]="incomeForm.category" name="category" required>
                <option value="" disabled>Выберите…</option>
                <option *ngFor="let c of incomeCategories" [value]="c">{{ c }}</option>
              </select>
            </div>
            <div class="field">
              <label>Сумма, ₽ *</label>
              <input type="number" min="0" step="0.01" [(ngModel)]="incomeForm.amount" name="amount" required />
            </div>
            <div class="field">
              <label>Примечание</label>
              <input [(ngModel)]="incomeForm.note" name="note" />
            </div>
          </div>
          <div class="row">
            <button type="submit" class="btn-primary" [disabled]="savingIncome">
              {{ savingIncome ? 'Сохранение…' : editingIncomeId ? 'Обновить' : 'Добавить' }}
            </button>
            <button type="button" (click)="resetIncomeForm()" *ngIf="editingIncomeId">Отмена</button>
          </div>
        </form>
      </div>

      <div class="card">
        <div class="row-between">
          <span class="muted">Период</span>
          <span>
            {{ report.range.startDate | date:'dd.MM.yyyy' }} — {{ report.range.endDate | date:'dd.MM.yyyy' }}
          </span>
        </div>
      </div>

      <div class="spinner" *ngIf="loading"></div>
    </div>
  `,
  styles: [`
    .page { max-width: 1000px; margin: 0 auto; }
    .page-title { margin: 0 0 2px; font-size: 22px; }
    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .stat { padding: 22px; }
    .stat-label { font-size: 12px; text-transform: uppercase; letter-spacing: .05em; color: var(--text-dim); margin-bottom: 8px; }
    .stat-value { font-size: 26px; font-weight: 700; font-variant-numeric: tabular-nums; }
    .income { color: var(--success); }
    .expense { color: var(--danger); }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0 18px; }
    @media (max-width: 700px) { .summary-grid { grid-template-columns: 1fr; } .grid { grid-template-columns: 1fr; } }
  `],
})
export class OdrComponent implements OnInit {
  report: OdrReport = { totalIncome: 0, totalExpense: 0, net: 0, range: { startDate: '', endDate: '' } };
  start = '';
  end = '';
  loading = false;
  error = '';

  readonly incomeCategories = INCOME_CATEGORIES;
  incomes: AdditionalIncome[] = [];
  loadingIncomes = false;
  savingIncome = false;
  editingIncomeId = '';
  incomeForm: AdditionalIncome = { date: toIsoDate(new Date()), amount: null, category: '', note: '' };

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly odrService: OdrService,
    private readonly incomeService: AdditionalIncomeService,
    private readonly toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.setPeriod('month');
    this.fetchIncomes();
  }

  get periodIncomes(): AdditionalIncome[] {
    if (!this.start || !this.end) return this.incomes;
    return this.incomes.filter(i => {
      const d = i.date ? i.date.slice(0, 10) : '';
      return d >= this.start && d <= this.end;
    });
  }

  get periodIncomesTotal(): number {
    return this.periodIncomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  }

  setPeriod(period: 'month' | 'quarter' | 'year'): void {
    const now = new Date();
    const start = new Date(now);
    if (period === 'month') start.setDate(1);
    if (period === 'quarter') start.setMonth(Math.floor(now.getMonth() / 3) * 3, 1);
    if (period === 'year') start.setMonth(0, 1);

    this.start = toIsoDate(start);
    this.end = toIsoDate(now);
    this.fetch();
  }

  fetch(): void {
    if (!this.start || !this.end) return;
    this.loading = true;
    this.error = '';
    this.odrService
      .report(this.start, this.end)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => (this.report = data),
        error: () => (this.error = 'Не удалось загрузить отчёт'),
        complete: () => (this.loading = false),
      });
  }

  fetchIncomes(): void {
    this.loadingIncomes = true;
    this.incomeService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => (this.incomes = data),
        error: err => (this.error = err?.error?.error || 'Не удалось загрузить поступления'),
        complete: () => (this.loadingIncomes = false),
      });
  }

  startEditIncome(item: AdditionalIncome): void {
    this.editingIncomeId = item._id ?? '';
    this.incomeForm = {
      date: item.date ? item.date.slice(0, 10) : toIsoDate(new Date()),
      category: item.category,
      amount: item.amount,
      note: item.note ?? '',
    };
  }

  resetIncomeForm(): void {
    this.editingIncomeId = '';
    this.incomeForm = { date: toIsoDate(new Date()), amount: null, category: '', note: '' };
  }

  saveIncome(): void {
    if (this.incomeForm.amount === null || this.incomeForm.amount === undefined) {
      this.error = 'Укажите сумму';
      return;
    }
    this.savingIncome = true;
    this.error = '';
    const payload = {
      date: this.incomeForm.date,
      amount: Number(this.incomeForm.amount),
      category: this.incomeForm.category,
      note: this.incomeForm.note,
    };
    const request = this.editingIncomeId
      ? this.incomeService.update(this.editingIncomeId, payload)
      : this.incomeService.create(payload);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.savingIncome = false;
        this.toast.success(this.editingIncomeId ? 'Поступление обновлено' : 'Поступление добавлено');
        this.resetIncomeForm();
        this.fetchIncomes();
        this.fetch();
      },
      error: err => {
        this.savingIncome = false;
        const message = err?.error?.error || 'Ошибка сохранения поступления';
        this.error = message;
        this.toast.error(message);
      },
    });
  }

  removeIncome(item: AdditionalIncome): void {
    if (!confirm(`Удалить поступление ${item.amount} ₽ (${item.category})?`)) return;
    this.incomeService
      .remove(item._id ?? '')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Поступление удалено');
          this.fetchIncomes();
          this.fetch();
        },
        error: err => {
          const message = err?.error?.error || 'Ошибка удаления поступления';
          this.error = message;
          this.toast.error(message);
        },
      });
  }
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
