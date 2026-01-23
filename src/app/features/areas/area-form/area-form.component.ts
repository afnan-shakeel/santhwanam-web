import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { SearchSelectComponent, SearchSelectOption } from '../../../shared/components/search-select/search-select.component';
import { AreaService } from '../../../core/services/area.service';
import { ForumService } from '../../../core/services/forum.service';
import { UserService } from '../../../core/services/user.service';
import { Area, CreateAreaRequest, UpdateAreaRequest } from '../../../shared/models/area.model';
import { Forum } from '../../../shared/models/forum.model';
import { User } from '../../../shared/models/user.model';
import { ButtonComponent } from "../../../shared/components/button/button.component";

@Component({
  selector: 'app-area-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    InputComponent,
    SearchSelectComponent,
    ButtonComponent
],
  templateUrl: './area-form.component.html',
  styleUrls: ['./area-form.component.css']
})
export class AreaFormComponent implements OnInit, OnChanges {
  @Input() areaId?: string;
  @Input() open = false;
  
  @Output() openChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<Area>();
  @Output() cancelled = new EventEmitter<void>();

  areaForm: FormGroup;
  loading = signal(false);
  saving = signal(false);
  isEditMode = signal(false);
  
  // Forum-related signals
  forums = signal<Forum[]>([]);
  forumsLoading = signal(false);
  
  forumOptions = computed<SearchSelectOption<string>[]>(() => {
    return this.forums().map(forum => ({
      value: forum.forumId,
      label: `${forum.forumName} (${forum.forumCode})`,
    }));
  });
  
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

  constructor(
    private fb: FormBuilder,
    private areaService: AreaService,
    private forumService: ForumService,
    private userService: UserService
  ) {
    this.areaForm = this.fb.group({
      forumId: ['', [Validators.required]],
      areaCode: ['', [Validators.required, Validators.maxLength(50)]],
      areaName: ['', [Validators.required, Validators.maxLength(100)]],
      adminUserId: ['', [Validators.required]],
      establishedDate: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Load initial forums and users
    this.loadForums('');
    this.loadUsers('');
    
    if (this.areaId) {
      this.isEditMode.set(true);
      this.loadArea();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) {
      if (this.areaId) {
        this.isEditMode.set(true);
        this.loadArea();
      } else {
        // Reset for create mode
        this.isEditMode.set(false);
        this.areaForm.reset();
        // Ensure all fields are enabled for create
        this.areaForm.get('forumId')?.enable();
        this.areaForm.get('areaCode')?.enable();
        this.areaForm.get('adminUserId')?.enable();
      }
    }
    
    if (changes['areaId']) {
      if (this.areaId) {
        this.isEditMode.set(true);
      } else {
        this.isEditMode.set(false);
      }
    }
  }

  loadArea(): void {
    if (!this.areaId) return;

    this.loading.set(true);
    this.areaService.getArea(this.areaId).subscribe({
      next: (area) => {
        // Convert date to YYYY-MM-DD format for date input
        const establishedDate = area.establishedDate 
          ? this.formatDateForInput(area.establishedDate)
          : '';

        this.areaForm.patchValue({
          forumId: area.forumId,
          areaCode: area.areaCode,
          areaName: area.areaName,
          adminUserId: area.adminUserId,
          establishedDate: establishedDate
        });
        
        // Load the specific forum for display in edit mode
        if (area.forumId) {
          this.forumService.getForum(area.forumId).subscribe({
            next: (forum) => {
              const currentForums = this.forums();
              if (!currentForums.find(f => f.forumId === forum.forumId)) {
                this.forums.set([forum, ...currentForums]);
              }
            },
            error: (error) => {
              console.error('Failed to load forum:', error);
            }
          });
        }
        
        // Load the specific user for display in edit mode
        if (area.adminUserId) {
          this.userService.getUser(area.adminUserId).subscribe({
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
        
        // Disable immutable fields in edit mode
        if (this.isEditMode()) {
          this.areaForm.get('forumId')?.disable();
          this.areaForm.get('areaCode')?.disable();
          this.areaForm.get('adminUserId')?.disable();
        }
        
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load area:', error);
        this.loading.set(false);
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

  onForumSearch(searchTerm: string): void {
    this.loadForums(searchTerm);
  }

  private loadForums(searchTerm: string): void {
    this.forumsLoading.set(true);
    
    this.forumService.searchForumsForSelect(searchTerm).subscribe({
      next: (forums) => {
        this.forums.set(forums);
        this.forumsLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load forums:', error);
        this.forumsLoading.set(false);
      }
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

  onSubmit(): void {
    if (this.areaForm.invalid) {
      this.areaForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formValue = this.areaForm.getRawValue();

    if (this.isEditMode() && this.areaId) {
      const updateRequest: UpdateAreaRequest = {
        areaName: formValue.areaName,
        establishedDate: formValue.establishedDate
      };

      this.areaService.updateArea(this.areaId, updateRequest).subscribe({
        next: (area) => {
          this.saving.set(false);
          this.saved.emit(area);
          this.closeModal();
        },
        error: (error) => {
          console.error('Failed to update area:', error);
          this.saving.set(false);
        }
      });
    } else {
      const createRequest: CreateAreaRequest = {
        forumId: formValue.forumId,
        areaCode: formValue.areaCode,
        areaName: formValue.areaName,
        adminUserId: formValue.adminUserId,
        establishedDate: formValue.establishedDate
      };

      this.areaService.createArea(createRequest).subscribe({
        next: (area) => {
          this.saving.set(false);
          this.saved.emit(area);
          this.closeModal();
        },
        error: (error) => {
          console.error('Failed to create area:', error);
          this.saving.set(false);
        }
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
    this.areaForm.reset();
    
    // Re-enable fields for next use
    this.areaForm.get('forumId')?.enable();
    this.areaForm.get('areaCode')?.enable();
    this.areaForm.get('adminUserId')?.enable();
  }

  getFieldError(fieldName: string): string {
    const control = this.areaForm.get(fieldName);
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
      forumId: 'Forum',
      areaCode: 'Area Code',
      areaName: 'Area Name',
      adminUserId: 'Admin User',
      establishedDate: 'Established Date'
    };
    return labels[fieldName] || fieldName;
  }
}
