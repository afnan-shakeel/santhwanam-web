import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/select/select.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { MemberService } from '../../../../core/services/member.service';
import { 
  Nominee, 
  AddNomineeRequest, 
  UpdateNomineeRequest,
  RelationType,
  IdProofType
} from '../../../../shared/models/member.model';

@Component({
  selector: 'app-nominees-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputComponent,
    SelectComponent,
    ButtonComponent
  ],
  templateUrl: './nominees-step.component.html',
  styleUrl: './nominees-step.component.css'
})
export class NomineesStepComponent implements OnInit {
  @Input() memberId!: string;
  
  @Output() back = new EventEmitter<void>();
  @Output() continue = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private memberService = inject(MemberService);

  nominees = signal<Nominee[]>([]);
  loading = signal(false);
  showNomineeForm = signal(false);
  editingNomineeId = signal<string | null>(null);

  nomineeForm!: FormGroup;

  relationTypeOptions: SelectOption<RelationType>[] = [
    { value: 'Father', label: 'Father' },
    { value: 'Mother', label: 'Mother' },
    { value: 'Spouse', label: 'Spouse' },
    { value: 'Son', label: 'Son' },
    { value: 'Daughter', label: 'Daughter' },
    { value: 'Brother', label: 'Brother' },
    { value: 'Sister', label: 'Sister' },
    { value: 'Other', label: 'Other' }
  ];

  idProofTypeOptions: SelectOption<IdProofType>[] = [
    { value: 'NationalID', label: 'National ID' },
    { value: 'Passport', label: 'Passport' },
    { value: 'DrivingLicense', label: 'Driving License' },
    { value: 'VoterID', label: 'Voter ID' },
    { value: 'Other', label: 'Other' }
  ];

  ngOnInit(): void {
    this.initializeForm();
    this.loadNominees();
  }

  private initializeForm(): void {
    this.nomineeForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
      relationType: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      contactNumber: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,20}$/)]],
      alternateContactNumber: ['', [Validators.pattern(/^\+?[0-9]{10,20}$/)]],
      addressLine1: ['', [Validators.required, Validators.maxLength(255)]],
      addressLine2: ['', [Validators.maxLength(255)]],
      city: ['', [Validators.required, Validators.maxLength(100)]],
      state: ['', [Validators.required, Validators.maxLength(100)]],
      postalCode: ['', [Validators.required, Validators.maxLength(20)]],
      country: ['India', [Validators.required, Validators.maxLength(100)]],
      idProofType: ['', Validators.required],
      idProofNumber: ['', [Validators.required, Validators.maxLength(100)]]
    });
  }

  private loadNominees(): void {
    this.loading.set(true);
    this.memberService.getNominees(this.memberId).subscribe({
      next: (nominees) => {
        this.nominees.set(nominees);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onAddNominee(): void {
    this.showNomineeForm.set(true);
    this.editingNomineeId.set(null);
    this.nomineeForm.reset({ country: 'India' });
  }

  onEditNominee(nominee: Nominee): void {
    this.showNomineeForm.set(true);
    this.editingNomineeId.set(nominee.nomineeId);
    this.nomineeForm.patchValue(nominee);
  }

  onCancelNomineeForm(): void {
    this.showNomineeForm.set(false);
    this.editingNomineeId.set(null);
    this.nomineeForm.reset({ country: 'India' });
  }

  onSaveNominee(): void {
    if (this.nomineeForm.invalid) {
      Object.keys(this.nomineeForm.controls).forEach(key => {
        this.nomineeForm.controls[key].markAsTouched();
      });
      return;
    }

    const formValue = this.nomineeForm.value;
    const editingId = this.editingNomineeId();

    if (editingId) {
      // Update existing nominee
      this.loading.set(true);
      this.memberService.updateNominee(this.memberId, editingId, formValue).subscribe({
        next: () => {
          this.loadNominees();
          this.onCancelNomineeForm();
        },
        error: () => {
          this.loading.set(false);
        }
      });
    } else {
      // Add new nominee
      this.loading.set(true);
      this.memberService.addNominee(this.memberId, formValue).subscribe({
        next: () => {
          this.loadNominees();
          this.onCancelNomineeForm();
        },
        error: () => {
          this.loading.set(false);
        }
      });
    }
  }

  onDeleteNominee(nomineeId: string): void {
    if (this.nominees().length === 1) {
      alert('Cannot remove the only nominee. At least one nominee is required.');
      return;
    }

    if (confirm('Are you sure you want to remove this nominee?')) {
      this.loading.set(true);
      this.memberService.deleteNominee(this.memberId, nomineeId).subscribe({
        next: () => {
          this.loadNominees();
        },
        error: () => {
          this.loading.set(false);
        }
      });
    }
  }

  onBack(): void {
    this.back.emit();
  }

  onContinue(): void {
    if (this.nominees().length === 0) {
      alert('Please add at least one nominee before continuing.');
      return;
    }

    this.loading.set(true);
    this.memberService.completeNomineesStep(this.memberId).subscribe({
      next: () => {
        this.loading.set(false);
        this.continue.emit();
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.nomineeForm.get(fieldName);
    if (!control || !control.touched || !control.errors) return '';

    const errors = control.errors;
    if (errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
    if (errors['minLength']) return `Minimum length is ${errors['minLength'].requiredLength}`;
    if (errors['maxLength']) return `Maximum length is ${errors['maxLength'].requiredLength}`;
    if (errors['pattern']) return 'Invalid phone number format';

    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Name',
      relationType: 'Relation Type',
      dateOfBirth: 'Date of Birth',
      contactNumber: 'Contact Number',
      addressLine1: 'Address Line 1',
      city: 'City',
      state: 'State',
      postalCode: 'Postal Code',
      country: 'Country',
      idProofType: 'ID Proof Type',
      idProofNumber: 'ID Proof Number'
    };
    return labels[fieldName] || fieldName;
  }
}
