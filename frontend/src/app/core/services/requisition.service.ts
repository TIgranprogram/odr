import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api';
import { Requisition } from '../models';

export interface RequisitionFilters {
  search?: string;
  status?: string;
  customer?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class RequisitionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/api/requisitions`;

  list(filters: RequisitionFilters = {}): Observable<Requisition[]> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.customer) params = params.set('customer', filters.customer);
    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));
    if (filters.sort) params = params.set('sort', filters.sort);
    return this.http.get<Requisition[]>(this.base, { params });
  }

  listPaged(filters: RequisitionFilters = {}): Observable<Paginated<Requisition>> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.customer) params = params.set('customer', filters.customer);
    params = params.set('page', String(filters.page ?? 1));
    params = params.set('limit', String(filters.limit ?? 25));
    if (filters.sort) params = params.set('sort', filters.sort);
    return this.http.get<Paginated<Requisition>>(`${this.base}/paged`, { params });
  }

  create(payload: Partial<Requisition>): Observable<Requisition> {
    return this.http.post<Requisition>(this.base, payload);
  }

  update(id: string, payload: Partial<Requisition>): Observable<Requisition> {
    return this.http.put<Requisition>(`${this.base}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
