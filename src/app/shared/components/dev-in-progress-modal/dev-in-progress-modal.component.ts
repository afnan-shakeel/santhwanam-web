import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dev-in-progress-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dev-in-progress-modal.component.html',
  styleUrl: './dev-in-progress-modal.component.css'
})
export class DevInProgressModalComponent {
  @Input() open = false;
  @Input() featureName = '';

  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}
