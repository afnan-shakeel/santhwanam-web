import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password-request',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password-request.component.html',
  styleUrl: './reset-password-request.component.css'
})
export class ResetPasswordRequestComponent {
  private authService = inject(AuthService);

  email = signal('');
  successMessage = signal('');
  errorMessage = signal('');
  isLoading = signal(false);

  onSubmit(): void {
    if (!this.email()) {
      this.errorMessage.set('Please enter your email address');
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email())) {
      this.errorMessage.set('Please enter a valid email address');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService.requestPasswordReset(this.email()).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.successMessage.set(response.message);
        this.email.set('');
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          error?.error?.message || 'An error occurred. Please try again.'
        );
      }
    });
  }
}
