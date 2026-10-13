import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api';
import { OdrReport } from '../models';

@Injectable({ providedIn: 'root' })
export class OdrService {
  private readonly http = inject(HttpClient);

  report(start: string, end: string): Observable<OdrReport> {
    const params = new HttpParams().set('start', start).set('end', end);
    return this.http.get<OdrReport>(`${API_URL}/api/odr`, { params });
  }
}
