export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-right' | 'bottom-right';

export interface ToastConfig {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // milliseconds, 0 = no auto-dismiss
  dismissable?: boolean; // default: true
  position?: ToastPosition; // default: 'top-right'
}

export interface Toast extends ToastConfig {
  id: string; // unique identifier
  timestamp: number;
}
