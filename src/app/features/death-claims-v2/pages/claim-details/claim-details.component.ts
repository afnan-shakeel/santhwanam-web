import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { TabsComponent, TabItem } from '../../../../shared/components/tabs/tabs.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

import { ClaimHeaderCardComponent } from '../../components/claim-header-card/claim-header-card.component';
import { ClaimActionBannerComponent } from '../../components/claim-action-banner/claim-action-banner.component';
import { DocumentListComponent } from '../../components/document-list/document-list.component';
import { ContributionProgressCardComponent } from '../../components/contribution-progress-card/contribution-progress-card.component';
import { ContributionTableComponent } from '../../components/contribution-table/contribution-table.component';
import { RecordCashModalV2Component } from '../../components/record-cash-modal/record-cash-modal.component';
import { MarkMissedDialogComponent } from '../../components/mark-missed-dialog/mark-missed-dialog.component';
import { DocumentUploadModalComponent } from '../../components/document-upload-modal/document-upload-modal.component';

import { DeathClaimsService } from '../../../../core/services/death-claims.service';
import { ContributionsService } from '../../../../core/services/contributions.service';
import { ApprovalWorkflowService } from '../../../../core/services/approval-workflow.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ApprovalExecution } from '../../../../shared/models/approval-workflow.model';
import {
  DeathClaim,
  DeathClaimDocument,
  ContributionCycle,
  MemberContribution,
  ClaimStatus
} from '../../../../shared/models/death-claim.model';
import { AccessService } from '../../../../core/services/access.service';

type ActiveTab = 'details' | 'contributions' | 'activity';

@Component({
  selector: 'app-claim-details-v2',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    BreadcrumbsComponent,
    TabsComponent,
    ModalComponent,
    ClaimHeaderCardComponent,
    ClaimActionBannerComponent,
    DocumentListComponent,
    ContributionProgressCardComponent,
    ContributionTableComponent,
    RecordCashModalV2Component,
    MarkMissedDialogComponent,
    DocumentUploadModalComponent
  ],
  templateUrl: './claim-details.component.html',
  styleUrls: ['./claim-details.component.css']
})
export class ClaimDetailsV2Component implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private claimsService = inject(DeathClaimsService);
  private contributionsService = inject(ContributionsService);
  private approvalService = inject(ApprovalWorkflowService);
  private accessService = inject(AccessService);
  private toastService = inject(ToastService);

  // Core state
  claimId = signal('');
  claim = signal<DeathClaim | null>(null);
  claimMember = computed(() => this.claim()?.member ?? null);
  claimNominee = computed(() => {
    const member = this.claim()?.member;
    return member?.nominees?.[0] ?? null;
  });
  documents = signal<DeathClaimDocument[]>([]);
  contributionCycle = signal<ContributionCycle | null>(null);

  // Approval state
  approvalExecutions = signal<ApprovalExecution[]>([]);
  currentExecution = computed(() => {
    const claim = this.claim();
    const executions = this.approvalExecutions();
    if (!claim?.approvalRequest?.currentStageOrder || !executions.length) return null;
    return executions.find(e => e.stageOrder === claim.approvalRequest!.currentStageOrder) ?? null;
  });

  // Upload modal
  showUploadModal = signal(false);

  // Loading
  claimLoading = signal(true);
  documentsLoading = signal(false);
  cycleLoading = signal(false);
  actionLoading = signal(false);

  // UI state
  activeTab = signal<ActiveTab>('details');
  _viewMode = this.accessService.viewMode; // 'superadmin' | 'admin' | 'agent'
  // compute a simplified view mode for easier permission checks in the template - with admin/agent only
  viewMode = computed(() => {
    const vm = this._viewMode();
    if (vm === 'superadmin' || vm === 'admin') return 'admin';
    return vm;
  });
  // viewMode = signal<'admin' | 'agent' | 'viewer'>('admin'); // TODO: derive from auth context

  // Modal state
  showRecordCashModal = signal(false);
  showMarkMissedDialog = signal(false);
  showSettlementModal = signal(false);
  showRejectionModal = signal(false);
  showSubmitApprovalModal = signal(false);
  rejectionComments = signal('');
  verificationNotes = signal('');
  selectedContribution = signal<MemberContribution | null>(null);
  settlementPaymentRef = signal('');

  // Tabs config
  tabs = computed<TabItem[]>(() => {
    const cycle = this.contributionCycle();
    const items: TabItem[] = [
      { id: 'details', label: 'Details & Documents' },
      { id: 'contributions', label: 'Contributions', badge: cycle ? 1 : undefined },
      { id: 'activity', label: 'Activity Log' }
    ];
    return items;
  });

  // Breadcrumbs
  breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const c = this.claim();
    return [
      { label: 'Death Claims', route: '/claims' },
      { label: c?.claimNumber || '...', current: true }
    ];
  });

  // Computed helpers
  hasCycle = computed(() => !!this.contributionCycle());
  canVerify = computed(() => this.viewMode() === 'admin');
  canUpload = computed(() => {
    const status = this.claim()?.claimStatus;
    return status === 'Reported' || status === 'UnderVerification';
  });
  canRecordPayment = computed(() => this.viewMode() === 'admin' || this.viewMode() === 'agent');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('claimId') || '';
    this.claimId.set(id);
    this.loadClaim();
  }

  onTabChange(tabId: string): void {
    this.activeTab.set(tabId as ActiveTab);
  }

  // === Banner Actions ===
  onBannerAction(action: string): void {
    switch (action) {
      case 'upload-documents':
        this.activeTab.set('details');
        this.showUploadModal.set(true);
        break;
      case 'request-docs':
        // TODO: request more docs flow
        this.toastService.info('Request more documents flow — coming soon');
        break;
      case 'verify-and-submit':
        this.showSubmitApprovalModal.set(true);
        break;
      case 'submit-for-approval':
        this.showSubmitApprovalModal.set(true);
        break;
      case 'approve':
        this.approveClaim();
        break;
      case 'reject':
        this.rejectClaim();
        break;
      case 'settle':
        this.showSettlementModal.set(true);
        break;
      case 'view-receipt':
        this.toastService.info('View receipt — coming soon');
        break;
      case 'reopen':
        this.toastService.info('Reopen claim — coming soon');
        break;
    }
  }

  // === Document Actions ===
  onViewDocument(doc: DeathClaimDocument): void {
    this.claimsService.downloadDocument(this.claimId(), doc.documentId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: () => this.toastService.error('Failed to download document')
    });
  }

  onVerifyDocument(doc: DeathClaimDocument): void {
    this.claimsService.verifyDocument(this.claimId(), doc.documentId, { verificationStatus: 'Verified' }).subscribe({
      next: () => {
        this.toastService.success(`"${doc.documentName}" verified`);
        this.loadDocuments();
      },
      error: () => this.toastService.error('Failed to verify document')
    });
  }

  onRejectDocument(doc: DeathClaimDocument): void {
    this.claimsService.verifyDocument(this.claimId(), doc.documentId, {
      verificationStatus: 'Rejected',
      rejectionReason: 'Document rejected during verification'
    }).subscribe({
      next: () => {
        this.toastService.warning(`"${doc.documentName}" rejected`);
        this.loadDocuments();
      },
      error: () => this.toastService.error('Failed to reject document')
    });
  }

  onUploadDocument(): void {
    this.showUploadModal.set(true);
  }

  onDocumentUploaded(doc: DeathClaimDocument): void {
    this.showUploadModal.set(false);
    this.loadDocuments();
  }

  // === Contribution Actions ===
  onRecordPayment(contrib: MemberContribution): void {
    this.selectedContribution.set(contrib);
    this.showRecordCashModal.set(true);
  }

  onMarkMissed(contrib: MemberContribution): void {
    this.selectedContribution.set(contrib);
    this.showMarkMissedDialog.set(true);
  }

  onCashRecorded(): void {
    this.showRecordCashModal.set(false);
    this.selectedContribution.set(null);
    this.loadCycle();
  }

  onMissedMarked(): void {
    this.showMarkMissedDialog.set(false);
    this.selectedContribution.set(null);
    this.loadCycle();
  }

  // === Settlement ===
  onConfirmSettlement(): void {
    this.actionLoading.set(true);
    this.claimsService.settleClaim(this.claimId(), {
      paymentMethod: 'BankTransfer',
      paymentReference: this.settlementPaymentRef() || undefined,
      paymentDate: new Date().toISOString()
    }).subscribe({
      next: () => {
        this.toastService.success('Claim settlement recorded successfully');
        this.showSettlementModal.set(false);
        this.settlementPaymentRef.set('');
        this.actionLoading.set(false);
        this.loadClaim();
      },
      error: () => {
        this.toastService.error('Failed to record settlement');
        this.actionLoading.set(false);
      }
    });
  }

  // === Claim Status Actions ===

  /**
   * Called when user confirms the "Verify & Send for Approval" modal.
   * If claim is UnderVerification → verify first, then submit.
   * If claim is Verified (edge case: verify succeeded previously but submit failed) → submit directly.
   */
  onConfirmSubmitForApproval(): void {
    const status = this.claim()?.claimStatus;
    if (status === 'Verified') {
      this.submitForApproval();
    } else {
      this.verifyAndSubmit();
    }
  }

  private verifyAndSubmit(): void {
    this.actionLoading.set(true);
    const notes = this.verificationNotes().trim() || undefined;

    this.claimsService.verifyClaim(this.claimId(), { verificationNotes: notes }).subscribe({
      next: () => {
        // Verify succeeded — now submit for approval
        this.submitForApproval();
      },
      error: () => {
        this.toastService.error('Failed to verify claim');
        this.actionLoading.set(false);
      }
    });
  }

  private submitForApproval(): void {
    this.actionLoading.set(true);
    this.claimsService.submitClaim(this.claimId()).subscribe({
      next: (response) => {
        this.toastService.success('Claim submitted for approval successfully');
        this.showSubmitApprovalModal.set(false);
        this.verificationNotes.set('');
        this.actionLoading.set(false);
        // Update claim state directly from response if available, else reload
        if (response?.data) {
          this.claim.set(response.data);
          this.loadDocuments();
        } else {
          this.loadClaim();
        }
      },
      error: () => {
        this.toastService.error('Failed to submit claim for approval');
        this.actionLoading.set(false);
        // If we got here after verify succeeded, reload to reflect Verified status
        this.loadClaim();
      }
    });
  }

  private approveClaim(): void {
    const execution = this.currentExecution();
    if (!execution) {
      this.toastService.error('No approval execution found for the current stage');
      return;
    }

    this.actionLoading.set(true);
    this.approvalService.processApproval({
      executionId: execution.executionId,
      decision: 'Approve'
    }).subscribe({
      next: () => {
        this.toastService.success('Claim approved successfully');
        this.actionLoading.set(false);
        this.loadClaim();
      },
      error: () => {
        this.toastService.error('Failed to approve claim');
        this.actionLoading.set(false);
      }
    });
  }

  private rejectClaim(): void {
    this.showRejectionModal.set(true);
  }

  onConfirmRejection(): void {
    const execution = this.currentExecution();
    if (!execution) {
      this.toastService.error('No approval execution found for the current stage');
      return;
    }

    const comments = this.rejectionComments().trim();
    if (!comments) {
      this.toastService.warning('Please provide a reason for rejection');
      return;
    }

    this.actionLoading.set(true);
    this.approvalService.processApproval({
      executionId: execution.executionId,
      decision: 'Reject',
      comments
    }).subscribe({
      next: () => {
        this.toastService.success('Claim rejected');
        this.showRejectionModal.set(false);
        this.rejectionComments.set('');
        this.actionLoading.set(false);
        this.loadClaim();
      },
      error: () => {
        this.toastService.error('Failed to reject claim');
        this.actionLoading.set(false);
      }
    });
  }

  // === Data Loading ===
  private loadClaim(): void {
    this.claimLoading.set(true);
    this.claimsService.getClaimById(this.claimId()).subscribe({
      next: (claim) => {
        this.claim.set(claim);
        this.claimLoading.set(false);
        this.loadDocuments();
        // Load approval details if pending approval
        if (claim.claimStatus === 'PendingApproval' && claim.approvalRequestId) {
          this.loadApprovalDetails(claim.approvalRequestId);
        }
        // Load cycle if claim is approved or settled
        if (claim.claimStatus === 'Approved' || claim.claimStatus === 'Settled') {
          this.loadCycle();
        }
      },
      error: () => {
        this.toastService.error('Failed to load claim details');
        this.claimLoading.set(false);
      }
    });
  }

  private loadDocuments(): void {
    this.documentsLoading.set(true);
    this.claimsService.getClaimDocuments(this.claimId()).subscribe({
      next: (docs) => {
        this.documents.set(docs);
        this.documentsLoading.set(false);
      },
      error: () => this.documentsLoading.set(false)
    });
  }

  private loadApprovalDetails(requestId: string): void {
    console.log('Loading approval details for requestId:', requestId);
    this.approvalService.getApprovalRequestDetails(requestId).subscribe({
      next: (response) => {
        console.log('Approval details loaded:', response);
        this.approvalExecutions.set(response.executions || []);
        console.log('Approval details loaded:', this.currentExecution());
      },
      error: () => {
        // Non-critical — approval actions just won't be available
        this.approvalExecutions.set([]);
      }
    });
  }

  private loadCycle(): void {
    this.cycleLoading.set(true);
    const claim = this.claim();
    const cycleId = claim?.contributionCycle?.cycleId || (claim as any)?.contributionCycleId;
    if (!cycleId) {
      this.cycleLoading.set(false);
      return;
    }

    this.contributionsService.getCycleById(cycleId).subscribe({
      next: (res) => {
        this.contributionCycle.set(res);
        this.cycleLoading.set(false);
      },
      error: () => this.cycleLoading.set(false)
    });
  }
}
