import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/select/select.component';
import { SearchSelectComponent, SearchSelectOption } from '../../../../shared/components/search-select/search-select.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { MembershipTierService } from '../../../../core/services/membership-tier.service';
import { UnitService } from '../../../../core/services/unit.service';
import { AgentService } from '../../../../core/services/agent.service';
import { Gender, RegisterMemberRequest, UpdateDraftPersonalDetailsRequest } from '../../../../shared/models/member.model';
import { MemberTier } from '../../../../shared/models/member.model';

@Component({
  selector: 'app-personal-details-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputComponent,
    SelectComponent,
    SearchSelectComponent,
    ButtonComponent
  ],
  templateUrl: './personal-details-step.component.html',
  styleUrl: './personal-details-step.component.css'
})
export class PersonalDetailsStepComponent implements OnInit {
  @Input() memberId: string | null = null;
  @Input() initialData: any = null;
  
  @Output() saveDraft = new EventEmitter<UpdateDraftPersonalDetailsRequest>();
  @Output() continue = new EventEmitter<RegisterMemberRequest>();

  private fb = inject(FormBuilder);
  private tierService = inject(MembershipTierService);
  private unitService = inject(UnitService);
  private agentService = inject(AgentService);

  personalForm!: FormGroup;
  loading = signal(false);
  
  // Dropdown options
  genderOptions: SelectOption<Gender>[] = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' }
  ];

  tierOptions = signal<SelectOption<string>[]>([]);
  unitOptions = signal<SearchSelectOption<string>[]>([]);
  agentOptions = signal<SearchSelectOption<string>[]>([]);

  loadingTiers = signal(false);
  loadingUnits = signal(false);
  loadingAgents = signal(false);

  ngOnInit(): void {
    this.initializeForm();
    this.loadTiers();
    
    if (this.initialData) {
      this.personalForm.patchValue(this.initialData);
    }
  }

  private initializeForm(): void {
    this.personalForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      middleName: ['', [Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      dateOfBirth: ['', [Validators.required, this.ageValidator.bind(this)]],
      gender: ['', Validators.required],
      contactNumber: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,20}$/)]],
      alternateContactNumber: ['', [Validators.pattern(/^\+?[0-9]{10,20}$/)]],
      email: ['', [Validators.email]],
      addressLine1: ['', [Validators.required, Validators.maxLength(255)]],
      addressLine2: ['', [Validators.maxLength(255)]],
      city: ['', [Validators.required, Validators.maxLength(100)]],
      state: ['', [Validators.required, Validators.maxLength(100)]],
      postalCode: ['', [Validators.required, Validators.maxLength(20)]],
      country: ['India', [Validators.required, Validators.maxLength(100)]],
      tierId: ['', Validators.required],
      unitId: ['', Validators.required],
      agentId: ['', Validators.required]
    });
  }

  private ageValidator(control: any): { [key: string]: boolean } | null {
    if (!control.value) return null;

    const birthDate = new Date(control.value);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 < 18 ? { 'minAge': true } : null;
    }
    
    return age < 18 ? { 'minAge': true } : null;
  }

  private loadTiers(): void {
    this.loadingTiers.set(true);
    this.tierService.getActiveTiersForRegistration().subscribe({
      next: (tiers: MemberTier[]) => {
        this.tierOptions.set(
          tiers.map(tier => ({
            value: tier.tierId,
            label: `${tier.tierName} (${tier.tierCode})`
          }))
        );
        // Set first tier as default for new registration (when no initialData)
        if (!this.initialData && tiers.length > 0 && !this.personalForm.get('tierId')?.value) {
          this.personalForm.patchValue({ tierId: tiers[0].tierId });
        }
        this.loadingTiers.set(false);
      },
      error: () => {
        this.loadingTiers.set(false);
      }
    });
  }

  onSearchUnits(searchTerm: string): void {
    if (!searchTerm || searchTerm.length < 2) {
      this.unitOptions.set([]);
      return;
    }

    this.loadingUnits.set(true);
    this.unitService.searchUnits({
      filters: [
        { field: 'unitName', operator: 'contains', value: searchTerm }
      ],
      page: 1,
      pageSize: 20
    }).subscribe({
      next: (response) => {
        this.unitOptions.set(
          response.items.map(unit => ({
            value: unit.unitId,
            label: `${unit.unitName} (${unit.unitCode})`
          }))
        );
        this.loadingUnits.set(false);
      },
      error: () => {
        this.loadingUnits.set(false);
      }
    });
  }

  onSearchAgents(searchTerm: string): void {
    if (!searchTerm || searchTerm.length < 2) {
      this.agentOptions.set([]);
      return;
    }

    this.loadingAgents.set(true);
    this.agentService.searchAgents({
      filters: [
        { field: 'firstName', operator: 'contains', value: searchTerm }
      ],
      page: 1,
      pageSize: 20
    }).subscribe({
      next: (response) => {
        this.agentOptions.set(
          response.items.map(agent => ({
            value: agent.agentId,
            label: `${agent.firstName} ${agent.lastName} (${agent.agentCode})`
          }))
        );
        this.loadingAgents.set(false);
      },
      error: () => {
        this.loadingAgents.set(false);
      }
    });
  }

  onSaveDraft(): void {
    const formValue = this.personalForm.value;
    this.saveDraft.emit(formValue);
  }

  onContinue(): void {
    if (this.personalForm.invalid) {
      Object.keys(this.personalForm.controls).forEach(key => {
        this.personalForm.controls[key].markAsTouched();
      });
      return;
    }

    const formValue = this.personalForm.value;
    this.continue.emit(formValue);
  }

  getFieldError(fieldName: string): string {
    const control = this.personalForm.get(fieldName);
    if (!control || !control.touched || !control.errors) return '';

    const errors = control.errors;
    if (errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
    if (errors['email']) return 'Invalid email format';
    if (errors['minLength']) return `Minimum length is ${errors['minLength'].requiredLength}`;
    if (errors['maxLength']) return `Maximum length is ${errors['maxLength'].requiredLength}`;
    if (errors['pattern']) return 'Invalid phone number format';
    if (errors['minAge']) return 'Member must be at least 18 years old';

    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'First Name',
      lastName: 'Last Name',
      dateOfBirth: 'Date of Birth',
      gender: 'Gender',
      contactNumber: 'Contact Number',
      email: 'Email',
      addressLine1: 'Address Line 1',
      city: 'City',
      state: 'State',
      postalCode: 'Postal Code',
      country: 'Country',
      tierId: 'Membership Tier',
      unitId: 'Unit',
      agentId: 'Agent'
    };
    return labels[fieldName] || fieldName;
  }
}
