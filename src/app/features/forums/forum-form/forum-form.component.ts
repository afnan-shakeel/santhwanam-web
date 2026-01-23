import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  signal,
  inject,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { SearchSelectComponent, SearchSelectOption } from '../../../shared/components/search-select/search-select.component';
import { ForumService } from '../../../core/services/forum.service';
import { UserService } from '../../../core/services/user.service';
import { Forum, CreateForumRequest, UpdateForumRequest } from '../../../shared/models/forum.model';
import { User } from '../../../shared/models/user.model';
import { ButtonComponent } from "../../../shared/components/button/button.component";

@Component({
  selector: 'app-forum-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    InputComponent,
    SearchSelectComponent,
    ButtonComponent
],
  templateUrl: './forum-form.component.html',
  styleUrls: ['./forum-form.component.css'],
})
export class ForumFormComponent implements OnInit, OnChanges {
  @Input() forumId?: string;
  @Input() open = false;

  @Output() openChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<Forum>();
  @Output() cancelled = new EventEmitter<void>();

  loading = signal(false);
  saving = signal(false);
  isEditMode = signal(false);
  
  // User-related signals
  users = signal<User[]>([]);
  usersLoading = signal(false);
  
  userOptions = computed<SearchSelectOption<string>[]>(() => {
    return this.users().map(user => ({
      value: user.userId,
      label: `${user.firstName} ${user.lastName}`,
      disabled: !user.isActive
    }));
  });

  fb = inject(FormBuilder);
  forumService = inject(ForumService);
  userService = inject(UserService);
  forumForm: FormGroup = this.fb.group({
    forumCode: ['', [Validators.required, Validators.maxLength(50)]],
    forumName: ['', [Validators.required, Validators.maxLength(100)]],
    adminUserId: ['', [Validators.required]],
    establishedDate: ['', [Validators.required]],
  });
  ngOnInit(): void {
    // Load initial users
    this.loadUsers('');
    
    if (this.forumId) {
      this.isEditMode.set(true);
      this.loadForum();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) {
      if (this.forumId) {
        this.isEditMode.set(true);
        this.loadForum();
      } else {
        // Reset for create mode
        this.isEditMode.set(false);
        this.forumForm.reset();
        // Ensure all fields are enabled for create
        this.forumForm.get('forumCode')?.enable();
        this.forumForm.get('adminUserId')?.enable();
      }
    }

    if (changes['forumId']) {
      if (this.forumId) {
        this.isEditMode.set(true);
      } else {
        this.isEditMode.set(false);
      }
    }
  }

  loadForum(): void {
    if (!this.forumId) return;

    this.loading.set(true);
    this.forumService.getForum(this.forumId).subscribe({
      next: (forum) => {
        // Convert date to YYYY-MM-DD format for date input
        const establishedDate = forum.establishedDate
          ? this.formatDateForInput(forum.establishedDate)
          : '';

        this.forumForm.patchValue({
          forumCode: forum.forumCode,
          forumName: forum.forumName,
          adminUserId: forum.adminUserId,
          establishedDate: establishedDate,
        });
        
        // Load the specific user for display in edit mode
        if (forum.adminUserId) {
          this.userService.getUser(forum.adminUserId).subscribe({
            next: (user) => {
              const currentUsers = this.users();
              if (!currentUsers.find(u => u.userId === user.userId)) {
                this.users.set([user, ...currentUsers]);
              }
            },
            error: (error) => {
              console.error('Failed to load user:', error);
            }
          });
        }

        // Disable forumCode in edit mode as it's not updatable
        if (this.isEditMode()) {
          this.forumForm.get('forumCode')?.disable();
          this.forumForm.get('adminUserId')?.disable();
        }

        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load forum:', error);
        this.loading.set(false);
      },
    });
  }

  onUserSearch(searchTerm: string): void {
    this.loadUsers(searchTerm);
  }

  private loadUsers(searchTerm: string): void {
    this.usersLoading.set(true);
    
    this.userService.searchUsersForSelect(searchTerm).subscribe({
      next: (users) => {
        this.users.set(users);
        this.usersLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load users:', error);
        this.usersLoading.set(false);
      }
    });
  }

  private formatDateForInput(dateString: string): string {
    // Handle both ISO format and YYYY-MM-DD format
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return as-is if invalid
    }

    // Format as YYYY-MM-DD for date input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onSubmit(): void {
    if (this.forumForm.invalid) {
      this.forumForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formValue = this.forumForm.getRawValue();

    if (this.isEditMode() && this.forumId) {
      const updateRequest: UpdateForumRequest = {
        forumName: formValue.forumName,
        establishedDate: formValue.establishedDate,
      };

      this.forumService.updateForum(this.forumId, updateRequest).subscribe({
        next: (forum) => {
          this.saving.set(false);
          this.saved.emit(forum);
          this.closeModal();
        },
        error: (error) => {
          console.error('Failed to update forum:', error);
          this.saving.set(false);
        },
      });
    } else {
      const createRequest: CreateForumRequest = {
        forumCode: formValue.forumCode,
        forumName: formValue.forumName,
        adminUserId: formValue.adminUserId,
        establishedDate: formValue.establishedDate,
      };

      this.forumService.createForum(createRequest).subscribe({
        next: (forum) => {
          this.saving.set(false);
          this.saved.emit(forum);
          this.closeModal();
        },
        error: (error) => {
          console.error('Failed to create forum:', error);
          this.saving.set(false);
        },
      });
    }
  }

  onCancel(): void {
    this.closeModal();
    this.cancelled.emit();
  }

  closeModal(): void {
    this.open = false;
    this.openChange.emit(false);
    this.forumForm.reset();

    // Re-enable fields for next use
    this.forumForm.get('forumCode')?.enable();
    this.forumForm.get('adminUserId')?.enable();
  }

  getFieldError(fieldName: string): string {
    const control = this.forumForm.get(fieldName);
    if (control?.touched && control?.errors) {
      if (control.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (control.errors['maxLength']) {
        return `${this.getFieldLabel(fieldName)} is too long`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      forumCode: 'Forum Code',
      forumName: 'Forum Name',
      adminUserId: 'Admin User',
      establishedDate: 'Established Date',
    };
    return labels[fieldName] || fieldName;
  }
}
