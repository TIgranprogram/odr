import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api';
import { Order } from '../models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/api/orders`;

  list(): Observable<Order[]> {
    return this.http.get<Order[]>(this.base);
  }

  create(payload: Partial<Order>): Observable<Order> {
    return this.http.post<Order>(this.base, payload);
  }
}
