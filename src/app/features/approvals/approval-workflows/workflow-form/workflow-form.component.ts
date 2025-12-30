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
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';

import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/select/select.component';
import {
  SearchSelectComponent,
  SearchSelectOption,
} from '../../../../shared/components/search-select/search-select.component';
import { CheckboxComponent } from '../../../../shared/components/checkbox/checkbox.component';
import { ApprovalWorkflowService } from '../../../../core/services/approval-workflow.service';
import { RoleService } from '../../../../core/services/role.service';
import { UserService } from '../../../../core/services/user.service';
import {
  ApprovalWorkflow,
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  ModuleType,
  ApproverType,
  OrganizationBody,
} from '../../../../shared/models/approval-workflow.model';
import { Role } from '../../../../shared/models/role.model';
import { User } from '../../../../shared/models/user.model';

@Component({
  selector: 'app-workflow-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    InputComponent,
    SelectComponent,
    SearchSelectComponent,
    CheckboxComponent,
  ],
  templateUrl: './workflow-form.component.html',
  styleUrls: ['./workflow-form.component.css'],
})
export class WorkflowFormComponent implements OnInit, OnChanges {
  @Input() workflowId?: string;
  @Input() open = false;

  @Output() openChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  loading = signal(false);
  saving = signal(false);
  isEditMode = signal(false);

  // Roles and Users
  roles = signal<Role[]>([]);
  rolesLoading = signal(false);
  users = signal<User[]>([]);
  usersLoading = signal(false);

  // Standard select options for roles (used with app-select)
  roleSelectOptions = computed<SelectOption<string>[]>(() => {
    return this.roles().map((role) => ({
      value: role.roleId,
      label: role.roleName,
    }));
  });

  // Standard select options for users (used with app-select)
  userSelectOptions = computed<SelectOption<string>[]>(() => {
    return this.users().map((user) => ({
      value: user.userId,
      label: `${user.firstName} ${user.lastName}`,
    }));
  });

  // Search select options for users (used with app-search-select)
  userOptions = computed<SearchSelectOption<string>[]>(() => {
    return this.users().map((user) => ({
      value: user.userId,
      label: `${user.firstName} ${user.lastName}`,
    }));
  });

  moduleOptions = [
    { label: 'Membership', value: 'Membership' },
    { label: 'Wallet', value: 'Wallet' },
    { label: 'Claims', value: 'Claims' },
    { label: 'Contributions', value: 'Contributions' },
    { label: 'Organization', value: 'Organization' },
  ];

  approverTypeOptions = [
    { label: 'Role', value: 'Role' },
    { label: 'Specific User', value: 'SpecificUser' },
    { label: 'Organization Admin', value: 'OrganizationAdmin' },
  ];

  organizationBodyOptions = [
    { label: 'Forum', value: 'Forum' },
    { label: 'Area', value: 'Area' },
    { label: 'Unit', value: 'Unit' },
  ];

  fb = inject(FormBuilder);
  workflowService = inject(ApprovalWorkflowService);
  roleService = inject(RoleService);
  userService = inject(UserService);

  workflowForm: FormGroup = this.fb.group({
    workflowCode: ['', [Validators.required, Validators.maxLength(50)]],
    workflowName: ['', [Validators.required, Validators.maxLength(100)]],
    description: [''],
    module: ['', [Validators.required]],
    entityType: ['', [Validators.required, Validators.maxLength(50)]],
    isActive: [true],
    requiresAllStages: [true],
    stages: this.fb.array([]),
  });

  get stages(): FormArray {
    return this.workflowForm.get('stages') as FormArray;
  }

  ngOnInit(): void {
    this.loadRoles('');
    this.loadUsers('');

    if (this.workflowId) {
      this.isEditMode.set(true);
      this.loadWorkflow();
    } else {
      // Add initial stage for new workflow
      this.addStage();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) {
      if (this.workflowId) {
        this.isEditMode.set(true);
        this.loadWorkflow();
      } else {
        this.isEditMode.set(false);
        this.workflowForm.reset({
          isActive: true,
          requiresAllStages: true,
        });
        this.stages.clear();
        this.addStage();
      }
    } else if (changes['open'] && !this.open) {
      // Modal closed - reset form
      this.workflowForm.reset({
        isActive: true,
        requiresAllStages: true,
      });
      this.stages.clear();
    }

    // Handle workflowId change when modal is already open
    if (changes['workflowId'] && this.open) {
      if (this.workflowId) {
        this.isEditMode.set(true);
        this.loadWorkflow();
      } else {
        this.isEditMode.set(false);
        this.workflowForm.reset({
          isActive: true,
          requiresAllStages: true,
        });
        this.stages.clear();
        this.addStage();
      }
    }
  }

  loadWorkflow(): void {
    if (!this.workflowId) return;

    this.loading.set(true);
    this.workflowService.getWorkflow(this.workflowId).subscribe({
      next: (workflow) => {
        // First patch the form values
        const formData = {
          workflowCode: workflow.workflowCode,
          workflowName: workflow.workflowName,
          description: workflow.description,
          module: workflow.module,
          entityType: workflow.entityType,
          isActive: workflow.isActive,
          requiresAllStages: workflow.requiresAllStages,
        };

        this.workflowForm.patchValue(formData);

        // Then disable fields in edit mode (after values are set)
        if (this.isEditMode()) {
          this.workflowForm.get('workflowCode')?.disable();
          this.workflowForm.get('module')?.disable();
          this.workflowForm.get('entityType')?.disable();
        }

        // Load stages
        this.stages.clear();
        workflow.stages
          .sort((a, b) => a.stageOrder - b.stageOrder)
          .forEach((stage) => {
            const stageGroup = this.fb.group({
              stageId: [stage.stageId],
              stageName: [stage.stageName, [Validators.required]],
              stageOrder: [stage.stageOrder],
              approverType: [stage.approverType, [Validators.required]],
              roleId: [stage.roleId],
              userId: [stage.userId],
              organizationBody: [stage.organizationBody],
              isOptional: [stage.isOptional],
              autoApprove: [stage.autoApprove],
            });

            // Set up valueChanges subscription for loaded stages
            stageGroup.get('approverType')?.valueChanges.subscribe((type: string | null) => {
              stageGroup.patchValue(
                {
                  roleId: null,
                  userId: null,
                  organizationBody: null,
                },
                { emitEvent: false }
              );
              
              // Trigger change detection
              stageGroup.updateValueAndValidity({ emitEvent: false });
            });

            this.stages.push(stageGroup);
          });

        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load workflow:', error);
        this.loading.set(false);
      },
    });
  }

  createStageFormGroup(): FormGroup {
    const formGroup = this.fb.group({
      stageId: [null],
      stageName: ['', [Validators.required]],
      stageOrder: [0],
      approverType: ['Role', [Validators.required]],
      roleId: [null],
      userId: [null],
      organizationBody: [null],
      isOptional: [false],
      autoApprove: [false],
    });

    // Subscribe to approverType changes to clear related fields
    // Use startWith to ensure subscription fires immediately
    formGroup.get('approverType')?.valueChanges.subscribe((type: string | null) => {
      formGroup.patchValue(
        {
          roleId: null,
          userId: null,
          organizationBody: null,
        },
        { emitEvent: false }
      );
      
      // Trigger change detection
      formGroup.updateValueAndValidity({ emitEvent: false });
    });

    return formGroup;
  }

  addStage(): void {
    const newStage = this.createStageFormGroup();
    newStage.patchValue({
      stageOrder: this.stages.length,
    });
    this.stages.push(newStage);
  }

  removeStage(index: number): void {
    if (this.stages.length > 1) {
      this.stages.removeAt(index);
      this.updateStageOrders();
    }
  }

  moveStageUp(index: number): void {
    if (index > 0) {
      const stage = this.stages.at(index);
      this.stages.removeAt(index);
      this.stages.insert(index - 1, stage);
      this.updateStageOrders();
    }
  }

  moveStageDown(index: number): void {
    if (index < this.stages.length - 1) {
      const stage = this.stages.at(index);
      this.stages.removeAt(index);
      this.stages.insert(index + 1, stage);
      this.updateStageOrders();
    }
  }

  updateStageOrders(): void {
    this.stages.controls.forEach((control, index) => {
      control.patchValue({ stageOrder: index });
    });
  }

  getStageApproverType(index: number): ApproverType | null {
    const stage = this.stages.at(index);
    if (!stage) return null;
    const approverType = stage.get('approverType')?.value;
    console.log('Approver Type for stage', index, ':', approverType);
    // Force return of current value, ensure it's evaluated fresh each time
    return approverType ?? null;
  }

  onApproverTypeChange(index: number, value: any): void {
    console.log('Approver type changed for stage', index, 'to:', value);
    const stage = this.stages.at(index);
    if (!stage) return;
    
    // Clear related fields when approver type changes
    stage.patchValue({
      roleId: null,
      userId: null,
      organizationBody: null,
    }, { emitEvent: false });
    
    // Force form update to trigger template re-evaluation
    stage.updateValueAndValidity();
    this.workflowForm.updateValueAndValidity();
  }

  onRoleSearch(searchTerm: string): void {
    this.loadRoles(searchTerm);
  }

  private loadRoles(searchTerm: string): void {
    this.rolesLoading.set(true);
    this.roleService
      .searchRoles({
        searchTerm,
        page: 1,
        pageSize: 50,
      })
      .subscribe({
        next: (response) => {
          this.roles.set(response.items);
          this.rolesLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load roles:', error);
          this.rolesLoading.set(false);
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
    const control = this.workflowForm.get(fieldName);
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

  getStageFieldError(index: number, fieldName: string): string {
    const control = this.stages.at(index).get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return '';
    }

    console.log(control.errors)
    if (control.errors['required']) {
      return 'This field is required';
    }

    return 'Invalid value';
  }

  onSubmit(): void {
    this.workflowForm.markAllAsTouched();
    // console errors here
    console.log('Form invalid:', this.workflowForm.invalid);
    // show error details
    console.log('Form errors:', this.workflowForm.errors);
    Object.keys(this.workflowForm.controls).forEach((key) => {
      const control = this.workflowForm.get(key);
      if (control?.invalid) {
        if(key == 'stages'){
            this.stages.controls.forEach((stageControl, index) => {
                console.log(`Stage ${index} invalid:`, stageControl.invalid, stageControl.errors);
                console.log(`Stage ${index} value:`, stageControl.value);
                // const fieldNames = Object.keys(stageControl);
                const userIdError = this.getStageFieldError(index, 'userId');
                const roleIdError = this.getStageFieldError(index, 'roleId');
                const organizationBodyError = this.getStageFieldError(index, 'organizationBody');
                const approverTypeError = this.getStageFieldError(index, 'approverType');
                if(userIdError) console.log(`Stage ${index} userId error:`, userIdError);
                if(roleIdError) console.log(`Stage ${index} roleId error:`, roleIdError);
                if(organizationBodyError) console.log(`Stage ${index} organizationBody error:`, organizationBodyError);
                if(approverTypeError) console.log(`Stage ${index} approverType error:`, approverTypeError);
            });
        }
        console.log(key, control.errors);
      }
    });
    if (this.workflowForm.invalid || this.saving()) return;

    this.stages.controls.forEach((control) => control.markAllAsTouched());

    if (this.workflowForm.invalid) {
      return;
    }

    this.saving.set(true);

    if (this.isEditMode() && this.workflowId) {
      this.updateWorkflow();
    } else {
      this.createWorkflow();
    }
  }

  private createWorkflow(): void {
    const formValue = this.workflowForm.getRawValue();
    const request: CreateWorkflowRequest = {
      workflowCode: formValue.workflowCode,
      workflowName: formValue.workflowName,
      description: formValue.description,
      module: formValue.module,
      entityType: formValue.entityType,
      isActive: formValue.isActive,
      requiresAllStages: formValue.requiresAllStages,
      stages: formValue.stages.map((stage: any) => ({
        stageName: stage.stageName,
        stageOrder: stage.stageOrder,
        approverType: stage.approverType,
        roleId: stage.roleId,
        userId: stage.userId,
        organizationBody: stage.organizationBody,
        isOptional: stage.isOptional,
        autoApprove: stage.autoApprove,
      })),
    };

    this.workflowService.createWorkflow(request).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.emit();
        this.openChange.emit(false);
      },
      error: (error) => {
        console.error('Failed to create workflow:', error);
        this.saving.set(false);
      },
    });
  }

  private updateWorkflow(): void {
    if (!this.workflowId) return;

    const formValue = this.workflowForm.getRawValue();
    const request: UpdateWorkflowRequest = {
      workflowName: formValue.workflowName,
      description: formValue.description,
      isActive: formValue.isActive,
      requiresAllStages: formValue.requiresAllStages,
      stages: formValue.stages.map((stage: any) => ({
        stageId: stage.stageId || null, // Include existing stageId, or null for new stages
        stageName: stage.stageName,
        stageOrder: stage.stageOrder,
        approverType: stage.approverType,
        roleId: stage.roleId,
        userId: stage.userId,
        organizationBody: stage.organizationBody,
        isOptional: stage.isOptional,
        autoApprove: stage.autoApprove,
      })),
    };

    this.workflowService.updateWorkflow(this.workflowId, request).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.emit();
        this.openChange.emit(false);
      },
      error: (error) => {
        console.error('Failed to update workflow:', error);
        this.saving.set(false);
      },
    });
  }

  onCancel(): void {
    this.cancelled.emit();
    this.openChange.emit(false);
  }
}
