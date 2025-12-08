import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../../environments/environment';

export interface ApiRequestOptions {
  headers?: HttpHeaders | Record<string, string | string[]>;
  params?: HttpParams | Record<string, string | number | boolean>;
}

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  get<T>(path: string, options: ApiRequestOptions = {}) {
    return this.http.get<T>(this.toUrl(path), options);
  }

  post<T>(path: string, body: unknown, options: ApiRequestOptions = {}) {
    return this.http.post<T>(this.toUrl(path), body, options);
  }

  put<T>(path: string, body: unknown, options: ApiRequestOptions = {}) {
    return this.http.put<T>(this.toUrl(path), body, options);
  }

  patch<T>(path: string, body: unknown, options: ApiRequestOptions = {}) {
    return this.http.patch<T>(this.toUrl(path), body, options);
  }

  delete<T>(path: string, options: ApiRequestOptions = {}) {
    return this.http.delete<T>(this.toUrl(path), options);
  }

  private toUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    return `${this.baseUrl}/${normalizedPath}`;
  }
}

