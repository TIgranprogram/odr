import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api';
import { Invoice } from '../models';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/api/invoices`;

  list(isPaid?: string): Observable<Invoice[]> {
    let params = new HttpParams();
    if (isPaid !== undefined && isPaid !== '') params = params.set('isPaid', isPaid);
    return this.http.get<Invoice[]>(this.base, { params });
  }

  create(payload: Partial<Invoice>): Observable<Invoice> {
    return this.http.post<Invoice>(this.base, payload);
  }
}
