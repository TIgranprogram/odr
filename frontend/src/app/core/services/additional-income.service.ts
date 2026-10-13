import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api';
import { AdditionalIncome } from '../models';

@Injectable({ providedIn: 'root' })
export class AdditionalIncomeService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/api/additional-incomes`;

  list(): Observable<AdditionalIncome[]> {
    return this.http.get<AdditionalIncome[]>(this.base);
  }

  create(payload: Partial<AdditionalIncome>): Observable<AdditionalIncome> {
    return this.http.post<AdditionalIncome>(this.base, payload);
  }

  update(id: string, payload: Partial<AdditionalIncome>): Observable<AdditionalIncome> {
    return this.http.put<AdditionalIncome>(`${this.base}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
