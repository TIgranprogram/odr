import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { inject, DestroyRef } from '@angular/core';
import { API_URL } from '../../core/api';

interface OdrReport {
  totalIncome: number;
  totalExpense: number;
  net: number;
  range: { startDate: string; endDate: string };
}

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
    @media (max-width: 700px) { .summary-grid { grid-template-columns: 1fr; } }
  `],
})
export class OdrComponent implements OnInit {
  report: OdrReport = { totalIncome: 0, totalExpense: 0, net: 0, range: { startDate: '', endDate: '' } };
  start = '';
  end = '';
  loading = false;
  error = '';

  constructor(private http: HttpClient) {}

  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.setPeriod('month');
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
    this.http
      .get<OdrReport>(`${API_URL}/api/odr`, { params: { start: this.start, end: this.end } })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => (this.report = data),
        error: () => (this.error = 'Не удалось загрузить отчёт'),
        complete: () => (this.loading = false),
      });
  }
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
