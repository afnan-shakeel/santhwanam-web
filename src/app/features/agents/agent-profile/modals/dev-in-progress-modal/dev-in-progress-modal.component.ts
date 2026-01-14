import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-dev-in-progress-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './dev-in-progress-modal.component.html',
  styleUrls: ['./dev-in-progress-modal.component.css']
})
export class DevInProgressModalComponent {
  open = input<boolean>(false);
  featureName = input<string>('');
  
  close = output<void>();

  onClose(): void {
    this.close.emit();
  }
}
