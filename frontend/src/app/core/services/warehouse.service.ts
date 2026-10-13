import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api';
import { Movement, StockItem } from '../models';

@Injectable({ providedIn: 'root' })
export class WarehouseService {
  private readonly http = inject(HttpClient);

  stockItems(): Observable<StockItem[]> {
    return this.http.get<StockItem[]>(`${API_URL}/api/stockitems`);
  }

  movements(): Observable<Movement[]> {
    return this.http.get<Movement[]>(`${API_URL}/api/warehouse`);
  }

  createMovement(payload: Partial<Movement>): Observable<Movement> {
    return this.http.post<Movement>(`${API_URL}/api/warehouse`, payload);
  }
}
