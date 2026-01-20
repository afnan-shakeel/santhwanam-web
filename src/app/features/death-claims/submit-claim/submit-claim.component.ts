import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../../shared/components/breadcrumbs/breadcrumbs.component';
import { MemberSearchSelectComponent, MemberSearchResult } from '../../../shared/components/member-search-select/member-search-select.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { DeathClaimsService } from '../../../core/services/death-claims.service';
import { ToastService } from '../../../core/services/toast.service';
import { ReportClaimRequest, ClaimDocumentType } from '../../../shared/models/death-claim.model';

type WizardStep = 'member-info' | 'nominee-payout' | 'documents';

@Component({
  selector: 'app-submit-claim',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BreadcrumbsComponent,
    MemberSearchSelectComponent,
    InputComponent
  ],
  templateUrl: './submit-claim.component.html',
  styleUrls: ['./submit-claim.component.css']
})
export class SubmitClaimComponent implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private claimsService = inject(DeathClaimsService);
  private toastService = inject(ToastService);

  currentStep = signal<WizardStep>('member-info');
  submitting = signal(false);
  error = signal<string | null>(null);

  // Store created claim ID after step 1
  createdClaimId = signal<string | null>(null);
  
  // Store selected member (populated from form control via memberSelected event)
  selectedMember = signal<MemberSearchResult | null>(null);

  // Step 1 Form: Member Information & Death Details
  step1Form!: FormGroup;

  // Step 2 Form: Nominee & Payout Details
  step2Form!: FormGroup;

  // Step 3: Document uploads (handled separately)
  uploadedDocuments = signal<Array<{
    type: ClaimDocumentType;
    file: File;
    description?: string;
  }>>([]);

  get maxDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Death Claims', route: '/death-claims' },
    { label: 'Submit New Claim', current: true }
  ];

  steps = [
    { id: 'member-info' as WizardStep, label: 'Member Information', number: 1 },
    { id: 'nominee-payout' as WizardStep, label: 'Nominee & Payout', number: 2 },
    { id: 'documents' as WizardStep, label: 'Upload Documents', number: 3 }
  ];

  currentStepIndex = computed(() => {
    const step = this.currentStep();
    return this.steps.findIndex(s => s.id === step);
  });

  ngOnInit(): void {
    this.initializeForms();
  }

  private initializeForms(): void {
    // Step 1: Member Information & Death Details
    this.step1Form = this.fb.group({
      memberId: ['', Validators.required],
      deathDate: ['', Validators.required],
      deathPlace: [''],
      causeOfDeath: [''],
      hospitalName: [''],
      doctorName: [''],
      additionalNotes: ['']
    });

    // Step 2: Nominee & Payout Details
    this.step2Form = this.fb.group({
      nomineeId: ['', Validators.required],
      bankName: ['', Validators.required],
      accountNumber: ['', Validators.required],
      iban: [''],
      accountHolderName: ['', Validators.required]
    });
  }

  onMemberSelected(member: MemberSearchResult): void {
    this.selectedMember.set(member);
    // The memberId is already set via formControlName binding
  }

  // Step 1: Submit death claim (calls report API)
  submitStep1(): void {
    if (this.step1Form.invalid) {
      this.error.set('Please fill in all required fields');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const formValue = this.step1Form.value;
    const request: ReportClaimRequest = {
      memberId: formValue.memberId,
      deathDate: new Date(formValue.deathDate).toISOString(),
      deathPlace: formValue.deathPlace || undefined,
      causeOfDeath: formValue.causeOfDeath || undefined,
      initialNotes: formValue.additionalNotes || undefined
    };

    this.claimsService.reportClaim(request).subscribe({
      next: (response) => {
        console.log('Claim reported successfully:', response);
        this.createdClaimId.set(response.claimId);
        this.submitting.set(false);
        this.toastService.show({
          type: 'success',
          title: 'Claim Reported',
          message: 'Death claim has been reported successfully.'
        });
        const claimId = this.createdClaimId();
        if (claimId) {
          this.router.navigate(['/death-claims', claimId]);
        } else {
          this.router.navigate(['/death-claims']);
        }

        // UPDATE: end in step one itself
        return;
        
        // Move to step 2

        this.currentStep.set('nominee-payout');
        this.error.set(null);
      },
      error: (errRes) => {
        console.log(errRes)
        this.submitting.set(false);
        this.error.set(errRes.error?.error?.message || 'Failed to report claim');
      }
    });
  }

  // Step 2: Submit nominee and payout details (API not implemented yet)
  submitStep2(): void {
    if (this.step2Form.invalid) {
      this.error.set('Please fill in all required fields');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    // TODO: Call API when implemented
    // const formValue = this.step2Form.value;
    // const claimId = this.createdClaimId();
    // this.claimsService.updateNomineePayoutDetails(claimId, formValue).subscribe(...)

    // For now, just move to step 3 after a short delay
    setTimeout(() => {
      this.submitting.set(false);
      this.toastService.show({
        type: 'success',
        title: 'Details Saved',
        message: 'Nominee and payout details saved successfully.'
      });
      this.currentStep.set('documents');
      this.error.set(null);
    }, 500);
  }

  // Step 3: Upload document
  onFileSelected(event: Event, documentType: ClaimDocumentType): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    const claimId = this.createdClaimId();

    if (!claimId) {
      this.error.set('No claim ID found. Please restart the process.');
      return;
    }

    this.submitting.set(true);

    this.claimsService.uploadDocument(
      claimId,
      documentType,
      file.name,
      file,
      file.type // mimeType
    ).subscribe({
      next: () => {
        this.uploadedDocuments.update(docs => [
          ...docs,
          { type: documentType, file }
        ]);
        this.submitting.set(false);
        this.toastService.show({
          type: 'success',
          title: 'Document Uploaded',
          message: `${documentType} uploaded successfully.`
        });
      },
      error: (err) => {
        this.submitting.set(false);
        this.toastService.show({
          type: 'error',
          title: 'Upload Failed',
          message: err.message || 'Failed to upload document'
        });
      }
    });
  }

  // Remove uploaded document
  removeDocument(documentType: ClaimDocumentType): void {
    this.uploadedDocuments.update(docs => 
      docs.filter(doc => doc.type !== documentType)
    );
  }

  // Check if document is uploaded
  isDocumentUploaded(documentType: ClaimDocumentType): boolean {
    return this.uploadedDocuments().some(doc => doc.type === documentType);
  }

  previousStep(): void {
    const currentIndex = this.currentStepIndex();
    if (currentIndex > 0) {
      this.currentStep.set(this.steps[currentIndex - 1].id);
      this.error.set(null);
    }
  }

  goToStep(step: WizardStep): void {
    this.currentStep.set(step);
    this.error.set(null);
  }

  cancel(): void {
    if (confirm('Are you sure you want to cancel? All entered data will be lost.')) {
      this.router.navigate(['/death-claims']);
    }
  }

  // Done button - just navigate back to dashboard
  done(): void {
    const claimId = this.createdClaimId();
    if (claimId) {
      this.router.navigate(['/death-claims', claimId]);
    } else {
      this.router.navigate(['/death-claims']);
    }
  }

  getStepStatus(stepId: WizardStep): 'completed' | 'current' | 'upcoming' {
    const currentIndex = this.currentStepIndex();
    const stepIndex = this.steps.findIndex(s => s.id === stepId);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  }
}
