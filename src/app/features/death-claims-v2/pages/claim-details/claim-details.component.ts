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

import { DeathClaimsService } from '../../../../core/services/death-claims.service';
import { ContributionsService } from '../../../../core/services/contributions.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  DeathClaim,
  DeathClaimDocument,
  ContributionCycle,
  MemberContribution,
  ClaimStatus
} from '../../../../shared/models/death-claim.model';

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
    MarkMissedDialogComponent
  ],
  templateUrl: './claim-details.component.html',
  styleUrls: ['./claim-details.component.css']
})
export class ClaimDetailsV2Component implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private claimsService = inject(DeathClaimsService);
  private contributionsService = inject(ContributionsService);
  private toastService = inject(ToastService);

  // Core state
  claimId = signal('');
  claim = signal<DeathClaim | null>(null);
  documents = signal<DeathClaimDocument[]>([]);
  contributionCycle = signal<ContributionCycle | null>(null);

  // Loading
  claimLoading = signal(true);
  documentsLoading = signal(false);
  cycleLoading = signal(false);
  actionLoading = signal(false);

  // UI state
  activeTab = signal<ActiveTab>('details');
  viewMode = signal<'admin' | 'agent' | 'viewer'>('admin'); // TODO: derive from auth context

  // Modal state
  showRecordCashModal = signal(false);
  showMarkMissedDialog = signal(false);
  showSettlementModal = signal(false);
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
        // TODO: trigger upload modal or scroll to documents section
        break;
      case 'request-docs':
        // TODO: request more docs flow
        this.toastService.info('Request more documents flow — coming soon');
        break;
      case 'verify-and-submit':
        this.verifyAndSubmit();
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
      paymentReference: this.settlementPaymentRef() || undefined
    } as any).subscribe({
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
  private verifyAndSubmit(): void {
    this.actionLoading.set(true);
    this.claimsService.verifyClaim(this.claimId(), {}).subscribe({
      next: () => {
        this.claimsService.submitClaim(this.claimId()).subscribe({
          next: () => {
            this.toastService.success('Claim verified and submitted for approval');
            this.actionLoading.set(false);
            this.loadClaim();
          },
          error: () => {
            this.toastService.error('Failed to submit for approval');
            this.actionLoading.set(false);
          }
        });
      },
      error: () => {
        this.toastService.error('Failed to verify claim');
        this.actionLoading.set(false);
      }
    });
  }

  private approveClaim(): void {
    // TODO: integrate with approval workflow API
    this.toastService.info('Approval workflow integration — coming soon');
  }

  private rejectClaim(): void {
    // TODO: open rejection modal with reason field
    this.toastService.info('Rejection flow — coming soon');
  }

  // === Data Loading ===
  private loadClaim(): void {
    this.claimLoading.set(true);
    this.claimsService.getClaimById(this.claimId()).subscribe({
      next: (claim) => {
        this.claim.set(claim);
        this.claimLoading.set(false);
        this.loadDocuments();
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
        this.contributionCycle.set(res.data);
        this.cycleLoading.set(false);
      },
      error: () => this.cycleLoading.set(false)
    });
  }
}
