import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api';
import { Product } from '../models';

export interface ProductQuery {
  category?: string;
  supplier?: string;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/api/products`;

  list(query: ProductQuery = {}): Observable<Product[]> {
    let params = new HttpParams();
    if (query.category) params = params.set('category', query.category);
    if (query.supplier) params = params.set('supplier', query.supplier);
    if (query.search) params = params.set('search', query.search);
    return this.http.get<Product[]>(this.base, { params });
  }
}
