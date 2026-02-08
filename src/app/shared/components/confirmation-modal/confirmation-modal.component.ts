import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ModalComponent } from '../modal/modal.component';
import { IconComponent } from '../icon/icon.component';
import { ConfirmationService, ConfirmationVariant } from '../../../core/services/confirmation.service';

// ═══════════════════════════════════════════════════════════════════════════
// VARIANT DEFAULTS
// ═══════════════════════════════════════════════════════════════════════════

const VARIANT_DEFAULTS: Record<ConfirmationVariant, {
  icon: string;
  confirmText: string;
  confirmButtonVariant: 'primary' | 'danger';
}> = {
  info: {
    icon: 'information-circle',
    confirmText: 'Confirm',
    confirmButtonVariant: 'primary'
  },
  warning: {
    icon: 'exclamation-triangle',
    confirmText: 'Continue',
    confirmButtonVariant: 'primary'
  },
  danger: {
    icon: 'trash',
    confirmText: 'Delete',
    confirmButtonVariant: 'danger'
  },
  success: {
    icon: 'check-circle',
    confirmText: 'Confirm',
    confirmButtonVariant: 'primary'
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, IconComponent],
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.css']
})
export class ConfirmationModalComponent {
  private confirmationService = inject(ConfirmationService);

  // State from service
  readonly isOpen = this.confirmationService.isOpen;
  readonly config = this.confirmationService.config;

  // Computed values with defaults
  readonly variant = computed(() => this.config()?.variant ?? 'info');

  readonly icon = computed(() => {
    const cfg = this.config();
    return cfg?.icon ?? VARIANT_DEFAULTS[this.variant()].icon;
  });

  readonly confirmText = computed(() => {
    const cfg = this.config();
    return cfg?.confirmText ?? VARIANT_DEFAULTS[this.variant()].confirmText;
  });

  readonly cancelText = computed(() => {
    return this.config()?.cancelText ?? 'Cancel';
  });

  readonly confirmButtonVariant = computed(() => {
    const cfg = this.config();
    return cfg?.confirmButtonVariant ?? VARIANT_DEFAULTS[this.variant()].confirmButtonVariant;
  });

  readonly iconColorClass = computed(() => {
    const colorMap: Record<ConfirmationVariant, string> = {
      info: 'text-blue-500',
      warning: 'text-amber-500',
      danger: 'text-red-500',
      success: 'text-green-500'
    };
    return colorMap[this.variant()];
  });

  // Actions
  onConfirm(): void {
    this.confirmationService.onConfirm();
  }

  onCancel(): void {
    this.confirmationService.onCancel();
  }
}
