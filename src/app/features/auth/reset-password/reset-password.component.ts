import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  token = signal<string | null>(null);
  newPassword = signal('');
  confirmPassword = signal('');
  successMessage = signal('');
  errorMessage = signal('');
  isLoading = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  // Password validation state
  passwordErrors = signal<string[]>([]);

  ngOnInit(): void {
    // Get the token from query params
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (!token) {
        this.errorMessage.set('Invalid or missing reset token. Please request a new password reset link.');
      } else {
        this.token.set(token);
      }
    });
  }

  validatePassword(): boolean {
    const password = this.newPassword();
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    this.passwordErrors.set(errors);
    return errors.length === 0;
  }

  onSubmit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    // Validate token
    if (!this.token()) {
      this.errorMessage.set('Invalid or missing reset token. Please request a new password reset link.');
      return;
    }

    // Validate password
    if (!this.newPassword()) {
      this.errorMessage.set('Please enter a new password');
      return;
    }

    if (!this.validatePassword()) {
      this.errorMessage.set('Please fix the password requirements');
      return;
    }

    // Validate password confirmation
    if (this.newPassword() !== this.confirmPassword()) {
      this.errorMessage.set('Passwords do not match');
      return;
    }

    this.isLoading.set(true);

    this.authService.resetPassword(this.token()!, this.newPassword()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Your password has been reset successfully. You can now sign in with your new password.');
        this.newPassword.set('');
        this.confirmPassword.set('');
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          error?.error?.message || 'Failed to reset password. The link may have expired. Please request a new reset link.'
        );
      }
    });
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update(v => !v);
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
