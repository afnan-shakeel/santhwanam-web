import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  private readonly toastService = inject(ToastService);

  showSuccessToast(): void {
    this.toastService.success(
      'Success!',
      'Operation completed successfully. Everything is working as expected.'
    );
  }

  showErrorToast(): void {
    this.toastService.error(
      'Error Occurred',
      'Something went wrong while processing your request. Please try again.'
    );
  }

  showWarningToast(): void {
    this.toastService.warning(
      'Warning',
      'This action may have unintended consequences. Please review before proceeding.'
    );
  }

  showInfoToast(): void {
    this.toastService.info(
      'Information',
      'Here is some helpful information about this feature and how to use it.'
    );
  }
}
