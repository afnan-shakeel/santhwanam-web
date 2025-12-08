import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = signal('');
  password = signal('');
  rememberMe = signal(false);
  errorMessage = signal('');
  isLoading = signal(false);
  private returnUrl = signal('/dashboard');

  ngOnInit(): void {
    // Get return URL from route parameters or default to '/dashboard'
    this.returnUrl.set(this.route.snapshot.queryParams['returnUrl'] || '/dashboard');
  }

  onSubmit(): void {
    if (!this.email() || !this.password()) {
      this.errorMessage.set('Please enter both email and password');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login({
      email: this.email(),
      password: this.password()
    }).subscribe({
      next: () => {
        this.router.navigateByUrl(this.returnUrl());
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          error?.error?.message || 'Invalid email or password. Please try again.'
        );
      }
    });
  }
}
