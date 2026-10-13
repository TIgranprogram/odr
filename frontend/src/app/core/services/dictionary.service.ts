import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api';
import { DictionaryItem } from '../models';

@Injectable({ providedIn: 'root' })
export class DictionaryService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/api/dictionaries`;

  list(category?: string): Observable<DictionaryItem[]> {
    const url = category ? `${this.base}/${encodeURIComponent(category)}` : this.base;
    return this.http.get<DictionaryItem[]>(url);
  }

  create(item: DictionaryItem): Observable<DictionaryItem> {
    return this.http.post<DictionaryItem>(this.base, item);
  }

  update(id: string, item: DictionaryItem): Observable<DictionaryItem> {
    return this.http.put<DictionaryItem>(`${this.base}/${id}`, item);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
