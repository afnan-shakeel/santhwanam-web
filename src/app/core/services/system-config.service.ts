import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { HttpService } from '../http/http.service';

export interface SystemConfig {
  key: string;
  value: string;
  dataType: 'string' | 'number' | 'boolean' | 'json';
  description?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class SystemConfigService {
  private http = inject(HttpService);
  private cache = new Map<string, SystemConfig>();

  /**
   * Get a system configuration by key
   */
  getConfig(key: string): Observable<SystemConfig> {
    return this.http.get<SystemConfig>(`/system-config/${key}`);
  }

  /**
   * Get a system configuration by key (async/await style with caching)
   */
  async get(key: string): Promise<SystemConfig | null> {
    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    try {
      const config = await firstValueFrom(this.getConfig(key));
      this.cache.set(key, config);
      return config;
    } catch (error) {
      console.error(`Failed to load system config: ${key}`, error);
      return null;
    }
  }

  /**
   * Get numeric config value with default
   */
  async getNumber(key: string, defaultValue: number): Promise<number> {
    const config = await this.get(key);
    if (config && config.dataType === 'number') {
      return Number(config.value);
    }
    return defaultValue;
  }

  /**
   * Get boolean config value with default
   */
  async getBoolean(key: string, defaultValue: boolean): Promise<boolean> {
    const config = await this.get(key);
    if (config && config.dataType === 'boolean') {
      return config.value === 'true';
    }
    return defaultValue;
  }

  /**
   * Get string config value with default
   */
  async getString(key: string, defaultValue: string): Promise<string> {
    const config = await this.get(key);
    if (config) {
      return config.value;
    }
    return defaultValue;
  }

  /**
   * Clear the cache (useful after config updates)
   */
  clearCache(): void {
    this.cache.clear();
  }
}
