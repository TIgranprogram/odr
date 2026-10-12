import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-odr',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h1 class="title">Отчет о доходах и расходах (ОДР)</h1>
      
      <div class="summary-card">
        <div class="card-item">
          <span>Всего Доходов:</span>
          <span class="income">{{ report.totalIncome | number:'1.2-2' }} ₽</span>
        </div>
        <div class="card-item">
          <span>Всего Расходов:</span>
          <span class="expense">{{ report.totalExpense | number:'1.2-2' }} ₽</span>
        </div>
        <div class="card-item highlight">
          <span>Чистая прибыль:</span>
          <span>{{ report.net | number:'1.2-2' }} ₽</span>
        </div>
      </div>

      <div class="details">
        <p>Период: {{ report.range.startDate | date:'dd.MM.yyyy' }} — {{ report.range.endDate | date:'dd.MM.yyyy' }}</p>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 20px; }
    .title { margin-bottom: 30px; }
    .summary-card {
      display: flex;
      gap: 20px;
      margin-bottom: 40px;
      padding: 30px;
      background: #f9f9f9;
      border-radius: 12px;
      border: 1px solid #eee;
    }
    .card-item {
      padding: 20px;
      border-radius: 8px;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .card-item span:first-child { font-size: 14px; color: #666; margin-bottom: 10px; }
    .card-item span:last-child { font-size: 24px; font-weight: bold; }
    .income span:last-child { color: green; }
    .expense span:last-child { color: red; }
    .highlight span:last-child { color: #007bff; }
    .details { font-size: 14px; color: #888; }
  `]
})
export class OdrComponent implements OnInit {
  report: any = { totalIncome: 0, totalExpense: 0, net: 0, range: { startDate: '', endDate: '' } };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 30); // Last 30 days default

    this.http.get<any>(`http://localhost:3000/api/odr/summary`).subscribe(data => {
      this.report = data;
    });
  }
}
