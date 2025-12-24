import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { SearchSelectComponent, SearchSelectOption } from '../../../shared/components/search-select/search-select.component';
import { UnitService } from '../../../core/services/unit.service';
import { ForumService } from '../../../core/services/forum.service';
import { AreaService } from '../../../core/services/area.service';
import { UserService } from '../../../core/services/user.service';
import { Unit, CreateUnitRequest, UpdateUnitRequest } from '../../../shared/models/unit.model';
import { Forum } from '../../../shared/models/forum.model';
import { Area } from '../../../shared/models/area.model';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-unit-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    InputComponent,
    SearchSelectComponent,
  ],
  templateUrl: './unit-form.component.html',
  styleUrls: ['./unit-form.component.css'],
})
export class UnitFormComponent implements OnInit, OnChanges {
  @Input() unitId?: string;
  @Input() open = false;

  @Output() openChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<Unit>();
  @Output() cancelled = new EventEmitter<void>();

  loading = signal(false);
  saving = signal(false);
  isEditMode = signal(false);

  // Forum-related signals
  forums = signal<Forum[]>([]);
  forumsLoading = signal(false);
  selectedForumId = signal<string | undefined>(undefined);

  forumOptions = computed<SearchSelectOption<string>[]>(() => {
    return this.forums().map((forum) => ({
      value: forum.forumId,
      label: `${forum.forumName} (${forum.forumCode})`,
    }));
  });

  // Area-related signals
  areas = signal<Area[]>([]);
  areasLoading = signal(false);

  areaOptions = computed<SearchSelectOption<string>[]>(() => {
    const selectedForum = this.selectedForumId();
    return this.areas()
      .filter((area) => !selectedForum || area.forumId === selectedForum)
      .map((area) => ({
        value: area.areaId,
        label: `${area.areaName} (${area.areaCode})`,
      }));
  });

  // User-related signals
  users = signal<User[]>([]);
  usersLoading = signal(false);

  userOptions = computed<SearchSelectOption<string>[]>(() => {
    return this.users().map((user) => ({
      value: user.userId,
      label: `${user.firstName} ${user.lastName}`,
      disabled: !user.isActive,
    }));
  });

  fb = inject(FormBuilder);
  unitService = inject(UnitService);
  forumService = inject(ForumService);
  areaService = inject(AreaService);
  userService = inject(UserService);

  unitForm: FormGroup = this.fb.group({
    forumId: [''],
    areaId: ['', [Validators.required]],
    unitCode: ['', [Validators.required, Validators.maxLength(50)]],
    unitName: ['', [Validators.required, Validators.maxLength(100)]],
    adminUserId: ['', [Validators.required]],
    establishedDate: ['', [Validators.required]],
  });

  ngOnInit(): void {
    // Load initial data
    this.loadForums('');
    this.loadAreas('');
    this.loadUsers('');

    // Watch forum selection to filter areas
    this.unitForm.get('forumId')?.valueChanges.subscribe((forumId) => {
      this.selectedForumId.set(forumId);
      // Reset area selection when forum changes
      if (!this.isEditMode()) {
        this.unitForm.patchValue({ areaId: '' });
      }
    });

    if (this.unitId) {
      this.isEditMode.set(true);
      this.loadUnit();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) {
      if (this.unitId) {
        this.isEditMode.set(true);
        this.loadUnit();
      } else {
        // Reset for create mode
        this.isEditMode.set(false);
        this.unitForm.reset();
        this.selectedForumId.set(undefined);
        // Ensure all fields are enabled for create
        this.unitForm.get('forumId')?.enable();
        this.unitForm.get('areaId')?.enable();
        this.unitForm.get('unitCode')?.enable();
        this.unitForm.get('adminUserId')?.enable();
      }
    }

    if (changes['unitId']) {
      if (this.unitId) {
        this.isEditMode.set(true);
      } else {
        this.isEditMode.set(false);
      }
    }
  }

  loadUnit(): void {
    if (!this.unitId) return;

    this.loading.set(true);
    this.unitService.getUnit(this.unitId).subscribe({
      next: (unit) => {
        // Convert date to YYYY-MM-DD format for date input
        const establishedDate = unit.establishedDate
          ? this.formatDateForInput(unit.establishedDate)
          : '';

        // Load area to get forumId
        this.areaService.getArea(unit.areaId).subscribe({
          next: (area) => {
            this.selectedForumId.set(area.forumId);

            this.unitForm.patchValue({
              forumId: area.forumId,
              areaId: unit.areaId,
              unitCode: unit.unitCode,
              unitName: unit.unitName,
              adminUserId: unit.adminUserId,
              establishedDate: establishedDate,
            });

            // Load the specific forum for display in edit mode
            if (area.forumId) {
              this.forumService.getForum(area.forumId).subscribe({
                next: (forum) => {
                  const currentForums = this.forums();
                  if (!currentForums.find((f) => f.forumId === forum.forumId)) {
                    this.forums.set([forum, ...currentForums]);
                  }
                },
                error: (error) => {
                  console.error('Failed to load forum:', error);
                },
              });
            }

            // Load the specific area for display
            const currentAreas = this.areas();
            if (!currentAreas.find((a) => a.areaId === area.areaId)) {
              this.areas.set([area, ...currentAreas]);
            }
          },
          error: (error) => {
            console.error('Failed to load area:', error);
          },
        });

        // Load the specific user for display in edit mode
        if (unit.adminUserId) {
          this.userService.getUser(unit.adminUserId).subscribe({
            next: (user) => {
              const currentUsers = this.users();
              if (!currentUsers.find((u) => u.userId === user.userId)) {
                this.users.set([user, ...currentUsers]);
              }
            },
            error: (error) => {
              console.error('Failed to load user:', error);
            },
          });
        }

        // Disable immutable fields in edit mode
        if (this.isEditMode()) {
          this.unitForm.get('forumId')?.disable();
          this.unitForm.get('areaId')?.disable();
          this.unitForm.get('unitCode')?.disable();
          this.unitForm.get('adminUserId')?.disable();
        }

        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load unit:', error);
        this.loading.set(false);
      },
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
    this.forumService
      .searchForums({
        searchTerm,
        page: 1,
        pageSize: 50,
      })
      .subscribe({
        next: (response) => {
          this.forums.set(response.items);
          this.forumsLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load forums:', error);
          this.forumsLoading.set(false);
        },
      });
  }

  onAreaSearch(searchTerm: string): void {
    this.loadAreas(searchTerm);
  }

  private loadAreas(searchTerm: string): void {
    this.areasLoading.set(true);
    this.areaService
      .searchAreas({
        searchTerm,
        page: 1,
        pageSize: 50,
      })
      .subscribe({
        next: (response) => {
          this.areas.set(response.items);
          this.areasLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load areas:', error);
          this.areasLoading.set(false);
        },
      });
  }

  onUserSearch(searchTerm: string): void {
    this.loadUsers(searchTerm);
  }

  private loadUsers(searchTerm: string): void {
    this.usersLoading.set(true);
    this.userService
      .searchUsers({
        searchTerm,
        page: 1,
        pageSize: 50,
      })
      .subscribe({
        next: (response) => {
          this.users.set(response.items);
          this.usersLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load users:', error);
          this.usersLoading.set(false);
        },
      });
  }

  getFieldError(fieldName: string): string {
    const control = this.unitForm.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return 'This field is required';
    }
    if (control.errors['maxlength']) {
      return `Maximum ${control.errors['maxlength'].requiredLength} characters allowed`;
    }

    return 'Invalid value';
  }

  onSubmit(): void {
    if (this.unitForm.invalid || this.saving()) return;

    this.saving.set(true);

    if (this.isEditMode() && this.unitId) {
      // Update existing unit
      const updateData: UpdateUnitRequest = {
        unitName: this.unitForm.value.unitName,
        establishedDate: this.unitForm.value.establishedDate,
      };

      this.unitService.updateUnit(this.unitId, updateData).subscribe({
        next: (unit) => {
          this.saving.set(false);
          this.saved.emit(unit);
          this.openChange.emit(false);
        },
        error: (error) => {
          console.error('Failed to update unit:', error);
          this.saving.set(false);
        },
      });
    } else {
      // Create new unit
      const createData: CreateUnitRequest = {
        areaId: this.unitForm.value.areaId,
        unitCode: this.unitForm.value.unitCode,
        unitName: this.unitForm.value.unitName,
        adminUserId: this.unitForm.value.adminUserId,
        establishedDate: this.unitForm.value.establishedDate,
      };

      this.unitService.createUnit(createData).subscribe({
        next: (unit) => {
          this.saving.set(false);
          this.saved.emit(unit);
          this.openChange.emit(false);
        },
        error: (error) => {
          console.error('Failed to create unit:', error);
          this.saving.set(false);
        },
      });
    }
  }

  onCancel(): void {
    this.cancelled.emit();
    this.openChange.emit(false);
  }
}
