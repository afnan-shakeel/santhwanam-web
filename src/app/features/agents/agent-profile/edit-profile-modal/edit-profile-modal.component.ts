import { Component, EventEmitter, Input, Output, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { AgentService } from '../../../../core/services/agent.service';
import { AgentProfile, UpdateAgentProfileRequest } from '../../../../shared/models/agent-profile.model';

@Component({
  selector: 'app-edit-profile-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    InputComponent
  ],
  templateUrl: './edit-profile-modal.component.html',
  styleUrls: ['./edit-profile-modal.component.css']
})
export class EditProfileModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private agentService = inject(AgentService);

  @Input({ required: true }) profile!: AgentProfile;
  @Output() closeModal = new EventEmitter<void>();
  @Output() profileUpdated = new EventEmitter<void>();

  submitting = signal(false);
  error = signal<string | null>(null);

  profileForm!: FormGroup;

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      firstName: [this.profile.firstName, [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
      middleName: [this.profile.middleName || ''],
      lastName: [this.profile.lastName, [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
      contactNumber: [this.profile.contactNumber, [Validators.required, Validators.minLength(10), Validators.maxLength(20)]],
      alternateContactNumber: [this.profile.alternateContactNumber || ''],
      email: [this.profile.email, [Validators.required, Validators.email]],
      addressLine1: [this.profile.addressLine1 || ''],
      addressLine2: [this.profile.addressLine2 || ''],
      city: [this.profile.city || ''],
      state: [this.profile.state || ''],
      postalCode: [this.profile.postalCode || ''],
      country: [this.profile.country || '']
    });
  }

  onClose(): void {
    this.closeModal.emit();
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const formValue = this.profileForm.value;
    const request: UpdateAgentProfileRequest = {
      firstName: formValue.firstName,
      middleName: formValue.middleName || null,
      lastName: formValue.lastName,
      contactNumber: formValue.contactNumber,
      alternateContactNumber: formValue.alternateContactNumber || null,
      email: formValue.email,
      addressLine1: formValue.addressLine1 || null,
      addressLine2: formValue.addressLine2 || null,
      city: formValue.city || null,
      state: formValue.state || null,
      postalCode: formValue.postalCode || null,
      country: formValue.country || null
    };

    this.agentService.updateAgentProfile(this.profile.agentId, request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.profileUpdated.emit();
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err?.error?.message || 'Failed to update profile. Please try again.');
      }
    });
  }

  hasError(field: string): boolean {
    const control = this.profileForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  getError(field: string): string {
    const control = this.profileForm.get(field);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'This field is required';
    if (control.errors['email']) return 'Please enter a valid email address';
    if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} characters required`;
    if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} characters allowed`;

    return 'Invalid value';
  }
}
