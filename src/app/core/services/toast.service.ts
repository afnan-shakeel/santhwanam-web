import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Toast, ToastConfig, ToastType } from '../../shared/models/toast.model';

const DEFAULT_DURATIONS = {
  success: 3000,  // 3 seconds
  info: 5000,     // 5 seconds
  warning: 7000,  // 7 seconds
  error: 10000    // 10 seconds
};

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$: Observable<Toast[]> = this.toastsSubject.asObservable();
  
  private maxToasts = 5;
  private timeouts = new Map<string, number>();

  /**
   * Show a toast notification
   * @param config Toast configuration
   * @returns Toast ID
   */
  show(config: ToastConfig): string {
    const toast: Toast = {
      id: this.generateId(),
      type: config.type,
      title: config.title,
      message: config.message,
      duration: config.duration ?? this.getDefaultDuration(config.type),
      dismissable: config.dismissable ?? true,
      position: config.position ?? 'top-right',
      timestamp: Date.now()
    };
    
    const currentToasts = this.toastsSubject.value;
    const newToasts = [toast, ...currentToasts].slice(0, this.maxToasts);
    this.toastsSubject.next(newToasts);
    
    // Auto-dismiss
    if (toast.duration && toast.duration > 0) {
      const timeoutId = window.setTimeout(() => {
        this.dismiss(toast.id);
      }, toast.duration);
      this.timeouts.set(toast.id, timeoutId);
    }
    
    return toast.id;
  }

  /**
   * Show success toast
   */
  success(title: string, message?: string, duration?: number): string {
    return this.show({ type: 'success', title, message, duration });
  }

  /**
   * Show error toast
   */
  error(title: string, message?: string, duration?: number): string {
    return this.show({ type: 'error', title, message, duration });
  }

  /**
   * Show warning toast
   */
  warning(title: string, message?: string, duration?: number): string {
    return this.show({ type: 'warning', title, message, duration });
  }

  /**
   * Show info toast
   */
  info(title: string, message?: string, duration?: number): string {
    return this.show({ type: 'info', title, message, duration });
  }

  /**
   * Dismiss a specific toast
   */
  dismiss(id: string): void {
    // Clear timeout if exists
    const timeoutId = this.timeouts.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      this.timeouts.delete(id);
    }

    // Remove toast from queue
    const toasts = this.toastsSubject.value.filter(t => t.id !== id);
    this.toastsSubject.next(toasts);
  }

  /**
   * Dismiss all toasts
   */
  dismissAll(): void {
    // Clear all timeouts
    this.timeouts.forEach(timeoutId => window.clearTimeout(timeoutId));
    this.timeouts.clear();
    
    // Clear all toasts
    this.toastsSubject.next([]);
  }

  /**
   * Get default duration for toast type
   */
  private getDefaultDuration(type: ToastType): number {
    return DEFAULT_DURATIONS[type];
  }

  /**
   * Generate unique ID for toast
   */
  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Clean up on service destruction
   */
  ngOnDestroy(): void {
    this.dismissAll();
  }
}
