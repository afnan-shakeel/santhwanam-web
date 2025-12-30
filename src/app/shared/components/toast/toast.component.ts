import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Toast } from '../../models/toast.model';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css'
})
export class ToastComponent {
  @Input() toast!: Toast;
  @Output() dismiss = new EventEmitter<string>();

  onDismiss(): void {
    this.dismiss.emit(this.toast.id);
  }
}
