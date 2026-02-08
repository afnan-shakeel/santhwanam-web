import { Injectable, signal } from '@angular/core';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ConfirmationVariant = 'info' | 'warning' | 'danger' | 'success';

export interface ConfirmationConfig {
  /** Modal title */
  title: string;

  /** Main message (required) */
  message: string;

  /** Additional description (optional) */
  description?: string;

  /** Visual variant - affects icon and button styling */
  variant?: ConfirmationVariant;

  /** Custom icon name override (for IconComponent) */
  icon?: string;

  /** Confirm button text */
  confirmText?: string;

  /** Cancel button text */
  cancelText?: string;

  /** Confirm button variant */
  confirmButtonVariant?: 'primary' | 'danger';
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  // State - used by the modal component
  readonly isOpen = signal(false);
  readonly config = signal<ConfirmationConfig | null>(null);

  // Private resolver for the promise
  private resolveConfirmation: ((value: boolean) => void) | null = null;

  /**
   * Show a confirmation modal and wait for user response.
   * Returns true if confirmed, false if cancelled.
   */
  confirm(config: ConfirmationConfig): Promise<boolean> {
    return new Promise((resolve) => {
      this.resolveConfirmation = resolve;
      this.config.set(config);
      this.isOpen.set(true);
    });
  }

  /**
   * Called by the modal component when user confirms
   */
  onConfirm(): void {
    this.resolveConfirmation?.(true);
    this.close();
  }

  /**
   * Called by the modal component when user cancels
   */
  onCancel(): void {
    this.resolveConfirmation?.(false);
    this.close();
  }

  private close(): void {
    this.isOpen.set(false);
    this.config.set(null);
    this.resolveConfirmation = null;
  }

  // ============================================
  // Convenience Methods
  // ============================================

  /**
   * Show a delete confirmation
   */
  confirmDelete(itemName: string, description?: string): Promise<boolean> {
    return this.confirm({
      title: 'Delete ' + itemName,
      message: `Are you sure you want to delete this ${itemName.toLowerCase()}?`,
      description: description ?? 'This action cannot be undone.',
      variant: 'danger',
      confirmText: 'Delete'
    });
  }

  /**
   * Show a warning confirmation
   */
  confirmWarning(title: string, message: string, description?: string): Promise<boolean> {
    return this.confirm({
      title,
      message,
      description,
      variant: 'warning'
    });
  }
}
