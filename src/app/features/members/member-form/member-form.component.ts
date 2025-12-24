import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProgressStepperComponent, StepConfig } from '../../../shared/components/progress-stepper/progress-stepper.component';
import { PersonalDetailsStepComponent } from './personal-details-step/personal-details-step.component';
import { NomineesStepComponent } from './nominees-step/nominees-step.component';
import { DocumentsPaymentStepComponent } from './documents-payment-step/documents-payment-step.component';
import { MemberService } from '../../../core/services/member.service';
import { RegisterMemberRequest, UpdateDraftPersonalDetailsRequest, Member } from '../../../shared/models/member.model';

type CurrentStep = 1 | 2 | 3;

@Component({
  selector: 'app-member-form',
  standalone: true,
  imports: [
    CommonModule,
    ProgressStepperComponent,
    PersonalDetailsStepComponent,
    NomineesStepComponent,
    DocumentsPaymentStepComponent
  ],
  templateUrl: './member-form.component.html',
  styleUrl: './member-form.component.css'
})
export class MemberFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private memberService = inject(MemberService);

  memberId = signal<string | null>(null);
  currentStep = signal<CurrentStep>(1);
  loading = signal(false);
  isEditMode = signal(false);
  memberData = signal<Member | null>(null);

  steps = computed<StepConfig[]>(() => {
    const current = this.currentStep();
    return [
      {
        title: 'Personal Details',
        description: 'Basic member information',
        status: current > 1 ? 'complete' : current === 1 ? 'current' : 'upcoming'
      },
      {
        title: 'Nominees',
        description: 'Add nominee details',
        status: current > 2 ? 'complete' : current === 2 ? 'current' : 'upcoming'
      },
      {
        title: 'Documents & Payment',
        description: 'Upload documents and record payment',
        status: current === 3 ? 'current' : 'upcoming'
      }
    ];
  });

  pageTitle = computed(() => {
    return this.isEditMode() ? 'Edit Member Registration' : 'New Member Registration';
  });

  ngOnInit(): void {
    // Check if we're in edit mode
    const memberId = this.route.snapshot.paramMap.get('memberId');
    if (memberId) {
      this.isEditMode.set(true);
      this.memberId.set(memberId);
      this.loadMemberData(memberId);
    }
  }

  private loadMemberData(memberId: string): void {
    this.loading.set(true);
    this.memberService.getMember(memberId).subscribe({
      next: (member) => {
        this.memberData.set(member);
        this.loading.set(false);
        
        // Set current step based on registration step
        switch (member.registrationStep) {
          case 'PersonalDetails':
            this.currentStep.set(1);
            break;
          case 'Nominees':
            this.currentStep.set(2);
            break;
          case 'DocumentsPayment':
            this.currentStep.set(3);
            break;
          default:
            this.currentStep.set(1);
        }
      },
      error: () => {
        this.loading.set(false);
        alert('Failed to load member data');
        this.router.navigate(['/members']);
      }
    });
  }

  // Step 1: Personal Details Handlers
  onSaveDraft(data: UpdateDraftPersonalDetailsRequest): void {
    const memberId = this.memberId();
    
    if (memberId) {
      // Update existing draft
      this.loading.set(true);
      this.memberService.updateDraftPersonalDetails(memberId, data).subscribe({
        next: () => {
          this.loading.set(false);
          alert('Draft saved successfully');
        },
        error: () => {
          this.loading.set(false);
          alert('Failed to save draft');
        }
      });
    } else {
      // For new registration, we need all required fields
      alert('Please fill all required fields to create a new member registration.');
    }
  }

  onContinueFromPersonalDetails(data: RegisterMemberRequest): void {
    const memberId = this.memberId();

    if (memberId) {
      // Complete step for existing member
      this.loading.set(true);
      this.memberService.completePersonalDetailsStep(memberId).subscribe({
        next: () => {
          this.loading.set(false);
          this.currentStep.set(2);
        },
        error: () => {
          this.loading.set(false);
          alert('Failed to complete personal details step');
        }
      });
    } else {
      // Register new member
      this.loading.set(true);
      this.memberService.registerMember(data).subscribe({
        next: (response) => {
          this.memberId.set(response.memberId);
          this.loading.set(false);
          this.currentStep.set(2);
          alert(`Member registered successfully! Member Code: ${response.memberCode}`);
        },
        error: () => {
          this.loading.set(false);
          alert('Failed to register member');
        }
      });
    }
  }

  // Step 2: Nominees Handlers
  onBackToPersonalDetails(): void {
    this.currentStep.set(1);
  }

  onContinueFromNominees(): void {
    this.currentStep.set(3);
  }

  // Step 3: Documents & Payment Handlers
  onBackToNominees(): void {
    this.currentStep.set(2);
  }

  onSubmitRegistration(): void {
    // Navigate to member details or list page
    alert('Registration submitted successfully! Pending approval.');
    this.router.navigate(['/members']);
  }
}
