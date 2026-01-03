import { Component, EventEmitter, Input, Output, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/select/select.component';
import { MemberService } from '../../../../core/services/member.service';
import { ToastService } from '../../../../core/services/toast.service';
import { MemberProfile, UpdateMemberProfileRequest } from '../../../../shared/models/member.model';

@Component({
  selector: 'app-edit-member-profile-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    InputComponent,
    SelectComponent
  ],
  templateUrl: './edit-member-profile-modal.component.html',
  styleUrls: ['./edit-member-profile-modal.component.css']
})
export class EditMemberProfileModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private memberService = inject(MemberService);
  private toastService = inject(ToastService);

  @Input({ required: true }) profile!: MemberProfile;
  @Output() closeModal = new EventEmitter<void>();
  @Output() profileUpdated = new EventEmitter<void>();

  submitting = signal(false);
  error = signal<string | null>(null);

  profileForm!: FormGroup;

  genderOptions: SelectOption[] = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' }
  ];

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      firstName: [this.profile.firstName, [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      middleName: [this.profile.middleName || ''],
      lastName: [this.profile.lastName, [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
      dateOfBirth: [this.formatDateForInput(this.profile.dateOfBirth), [Validators.required]],
      gender: [this.profile.gender, [Validators.required]],
      contactNumber: [this.profile.contactNumber, [Validators.required, Validators.minLength(10), Validators.maxLength(20)]],
      email: [this.profile.email || '', [Validators.email]],
      addressLine1: [this.profile.addressLine1 || ''],
      addressLine2: [this.profile.addressLine2 || ''],
      city: [this.profile.state || ''], // Using state as city for now based on model
      postalCode: [this.profile.postalCode || ''],
      country: [this.profile.country || '']
    });
  }

  private formatDateForInput(dateStr: string | undefined): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0]; // yyyy-MM-dd format
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
    const request: UpdateMemberProfileRequest = {
      firstName: formValue.firstName,
      middleName: formValue.middleName || undefined,
      lastName: formValue.lastName,
      dateOfBirth: formValue.dateOfBirth,
      gender: formValue.gender,
      contactNumber: formValue.contactNumber,
      email: formValue.email || undefined,
      addressLine1: formValue.addressLine1 || undefined,
      addressLine2: formValue.addressLine2 || undefined,
      city: formValue.city || undefined,
      postalCode: formValue.postalCode || undefined,
      country: formValue.country || undefined
    };

    this.memberService.updateMemberProfile(this.profile.memberId, request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastService.success('Profile Updated', 'Your profile has been updated successfully.');
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
