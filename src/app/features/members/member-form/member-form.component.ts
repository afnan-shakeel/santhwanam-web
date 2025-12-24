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
      // Register new member as draft
      this.loading.set(true);
      this.memberService.registerMember(data as RegisterMemberRequest).subscribe({
        next: (response) => {
          this.memberId.set(response.memberId);
          this.loading.set(false);
          alert(`Draft saved successfully! Member Code: ${response.memberCode}`);
        },
        error: () => {
          this.loading.set(false);
          alert('Failed to save draft');
        }
      });
    }
  }

  onContinueFromPersonalDetails(data: RegisterMemberRequest): void {
    const memberId = this.memberId();
    this.loading.set(true);

    if (memberId) {
      // TWO-STEP for existing draft: 1) Update data, 2) Complete step
      this.memberService.updateDraftPersonalDetails(memberId, data).subscribe({
        next: () => {
          // Step 1 succeeded, now complete the step
          this.memberService.completePersonalDetailsStep(memberId).subscribe({
            next: () => {
              this.loading.set(false);
              this.currentStep.set(2);
            },
            error: () => {
              this.loading.set(false);
              alert('Failed to complete personal details step. Please retry.');
            }
          });
        },
        error: () => {
          this.loading.set(false);
          alert('Failed to update member data');
        }
      });
    } else {
      // TWO-STEP for new member: 1) Register, 2) Complete step
      this.memberService.registerMember(data).subscribe({
        next: (response) => {
          this.memberId.set(response.memberId);
          // Step 1 succeeded, now complete the step
          this.memberService.completePersonalDetailsStep(response.memberId).subscribe({
            next: () => {
              this.loading.set(false);
              this.currentStep.set(2);
              alert(`Member registered successfully! Member Code: ${response.memberCode}`);
            },
            error: () => {
              this.loading.set(false);
              alert('Member created but failed to complete step. Please click Continue again.');
            }
          });
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
    const memberId = this.memberId();
    if (!memberId) {
      alert('Invalid member ID');
      return;
    }

    this.loading.set(true);
    this.memberService.completeNomineesStep(memberId).subscribe({
      next: () => {
        this.loading.set(false);
        this.currentStep.set(3);
      },
      error: () => {
        this.loading.set(false);
        alert('Failed to complete nominees step. Please ensure at least one nominee is added.');
      }
    });
  }

  // Step 3: Documents & Payment Handlers
  onBackToNominees(): void {
    this.currentStep.set(2);
  }

  onSubmitRegistration(): void {
    const memberId = this.memberId();
    if (!memberId) {
      alert('Invalid member ID');
      return;
    }

    this.loading.set(true);
    this.memberService.submitRegistration(memberId).subscribe({
      next: () => {
        this.loading.set(false);
        alert('Registration submitted successfully! Pending approval.');
        this.router.navigate(['/members']);
      },
      error: () => {
        this.loading.set(false);
        alert('Failed to submit registration');
      }
    });
  }
}
