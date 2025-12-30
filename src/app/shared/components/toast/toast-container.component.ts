import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ToastService } from '../../../core/services/toast.service';
import { ToastComponent } from './toast.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, ToastComponent],
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.css'
})
export class ToastContainerComponent {
  private toastService = inject(ToastService);
  
  toasts = toSignal(this.toastService.toasts$, { initialValue: [] });
  
  topRightToasts = computed(() => 
    this.toasts().filter(t => t.position === 'top-right')
  );
  
  bottomRightToasts = computed(() => 
    this.toasts().filter(t => t.position === 'bottom-right')
  );
  
  onDismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}
