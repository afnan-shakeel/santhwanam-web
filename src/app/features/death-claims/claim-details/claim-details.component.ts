import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../../shared/components/breadcrumbs/breadcrumbs.component';
import { DatatableComponent } from '../../../shared/components/datatable/datatable.component';
import { DeathClaimsService } from '../../../core/services/death-claims.service';
import { ContributionsService } from '../../../core/services/contributions.service';
import { ToastService } from '../../../core/services/toast.service';
import { DocumentUploadModalComponent } from './document-upload-modal/document-upload-modal.component';
import { AcknowledgeContributionModalComponent } from './acknowledge-contribution-modal/acknowledge-contribution-modal.component';
import { RecordCashModalComponent } from './record-cash-modal/record-cash-modal.component';
import { SubmitApprovalModalComponent } from './submit-approval-modal/submit-approval-modal.component';
import { DataTableConfig } from '../../../shared/models/datatable.model';
import { SearchRequest, SearchResponse } from '../../../shared/models/search.model';
import {
  DeathClaim,
  DeathClaimDocument,
  ContributionCycle,
  MemberContribution,
  ClaimStatus,
  DocumentVerificationStatus
} from '../../../shared/models/death-claim.model';

type TabId = 'overview' | 'documents' | 'contribution-cycle' | 'timeline';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-claim-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BreadcrumbsComponent,
    DatatableComponent,
    DocumentUploadModalComponent,
    AcknowledgeContributionModalComponent,
    RecordCashModalComponent,
    SubmitApprovalModalComponent
  ],
  templateUrl: './claim-details.component.html',
  styleUrls: ['./claim-details.component.css']
})
export class ClaimDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private claimsService = inject(DeathClaimsService);
  private contributionsService = inject(ContributionsService);
  private toastService = inject(ToastService);

  // State
  claimId = signal<string>('');
  claim = signal<DeathClaim | null>(null);
  documents = signal<DeathClaimDocument[]>([]);
  contributionCycle = signal<ContributionCycle | null>(null);
  contributions = signal<MemberContribution[]>([]);
  
  // Contributions datatable data
  contributionsData = signal<SearchResponse<MemberContribution>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0
  });

  // Loading states
  claimLoading = signal(true);
  documentsLoading = signal(false);
  cycleLoading = signal(false);
  contributionsLoading = signal(false);
  actionLoading = signal(false);

  // UI state
  activeTab = signal<TabId>('overview');
  selectedDocuments = signal<Set<string>>(new Set());
  verificationNotes = signal('');

  // Modal state
  showUploadModal = signal(false);
  showAcknowledgeModal = signal(false);
  showRecordCashModal = signal(false);
  showSubmitApprovalModal = signal(false);
  selectedContribution = signal<MemberContribution | null>(null);

  // Tabs
  tabs: Tab[] = [
    { id: 'overview', label: 'Overview', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'documents', label: 'Documents', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
    { id: 'contribution-cycle', label: 'Contribution Cycle', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'timeline', label: 'Timeline', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }
  ];

  // Contributions table config
  contributionsTableConfig: DataTableConfig<MemberContribution> = {
    columns: [
      {
        key: 'member',
        label: 'Member',
        sortable: true,
        format: (value: any) => value ? `${value.firstName} ${value.lastName}` : '-'
      },
      {
        key: 'member.memberCode',
        label: 'Member Code',
        sortable: true,
        format: (value: any, row: MemberContribution) => row.member?.memberCode || '-'
      },
      {
        key: 'agent',
        label: 'Agent',
        sortable: true,
        format: (value: any) => value ? `${value.firstName} ${value.lastName}` : '-'
      },
      {
        key: 'expectedAmount',
        label: 'Amount',
        sortable: true,
        type: 'number',
        format: (value: number) => `₹${value?.toLocaleString() || '0'}`
      },
      {
        key: 'contributionStatus',
        label: 'Status',
        sortable: true,
        type: 'badge'
      },
      {
        key: 'collectedAt',
        label: 'Collected At',
        sortable: true,
        type: 'date'
      }
    ],
    actions: [
      {
        label: 'Acknowledge',
        callback: (contrib: MemberContribution) => this.openAcknowledgeModal(contrib),
        visible: (contrib: MemberContribution) => contrib.contributionStatus === 'WalletDebitRequested'
      },
      {
        label: 'Record Cash',
        callback: (contrib: MemberContribution) => this.openRecordCashModal(contrib),
        visible: (contrib: MemberContribution) => contrib.contributionStatus === 'Pending' || contrib.contributionStatus === 'WalletDebitRequested'
      },
      {
        label: 'Mark Missed',
        callback: (contrib: MemberContribution) => this.markContributionMissed(contrib),
        visible: (contrib: MemberContribution) => contrib.contributionStatus === 'Pending' || contrib.contributionStatus === 'WalletDebitRequested'
      }
    ],
    showActions: true,
    pageSize: 10,
    eagerLoad: ['member', 'agent'],
    filters: [
      {
        key: 'contributionStatus',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'Pending', value: 'Pending' },
          { label: 'Collected', value: 'Collected' },
          { label: 'Missed', value: 'Missed' },
          // { label: 'Exempted', value: 'Exempted' },
        ]
      }
    ]
  };

  // Computed
  breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const claim = this.claim();
    return [
      { label: 'Death Claims', route: '/death-claims' },
      { label: claim?.claimNumber || 'Loading...', current: true }
    ];
  });

  pendingDocuments = computed(() => 
    this.documents().filter(d => d.verificationStatus === 'Pending')
  );

  verifiedDocuments = computed(() => 
    this.documents().filter(d => d.verificationStatus === 'Verified')
  );

  rejectedDocuments = computed(() => 
    this.documents().filter(d => d.verificationStatus === 'Rejected')
  );

  allDocumentsVerified = computed(() => {
    const docs = this.documents();
    return docs.length > 0 && docs.every(d => d.verificationStatus === 'Verified');
  });

  cycleProgress = computed(() => {
    const cycle = this.contributionCycle();
    if (!cycle || cycle.totalMembers === 0) return 0;
    return Math.round((cycle.totalCollectedAmount / cycle.totalExpectedAmount) * 100);
  });

  canBulkVerify = computed(() => {
    return this.selectedDocuments().size > 0;
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('claimId');
      if (id) {
        this.claimId.set(id);
        this.loadClaim();
      }
    });

    this.route.queryParamMap.subscribe(params => {
      const tab = params.get('tab') as TabId;
      if (tab && this.tabs.some(t => t.id === tab)) {
        this.activeTab.set(tab);
      }
    });
  }

  loadClaim(): void {
    this.claimLoading.set(true);
    this.claimsService.getClaimById(this.claimId()).subscribe({
      next: (response) => {
        this.claim.set(response);
        this.claimLoading.set(false);
        
        // Load documents
        this.loadDocuments();
        
        // Load contribution cycle if claim has one
        if (response.contributionCycle) {
          this.contributionCycle.set(response.contributionCycle);
          this.loadContributions(response?.contributionCycle?.cycleId);
        }
      },
      error: (error) => {
        console.error('Failed to load claim:', error);
        this.claimLoading.set(false);
        this.toastService.error('Error', 'Failed to load claim details');
      }
    });
  }

  loadDocuments(): void {
    this.documentsLoading.set(true);
    this.claimsService.getClaimDocuments(this.claimId()).subscribe({
      next: (response) => {
        this.documents.set(response);
        this.documentsLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load documents:', error);
        this.documentsLoading.set(false);
      }
    });
  }

  loadContributions(cycleId: string): void {
    this.contributionsLoading.set(true);
    
    const request: SearchRequest = {
      filters: [{ field: 'cycleId', operator: 'equals', value: cycleId }],
      pageSize: 10,
      page: 1,
      eagerLoad: ['member', 'agent']
    };

    this.contributionsService.searchContributions(request).subscribe({
      next: (response) => {
        this.contributions.set(response.items);
        this.contributionsData.set(response);
        this.contributionsLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load contributions:', error);
        this.contributionsLoading.set(false);
      }
    });
  }

  onContributionsSearchChange(request: SearchRequest): void {
    const cycleId = this.contributionCycle()?.cycleId;
    if (!cycleId) return;

    this.contributionsLoading.set(true);
    
    // Add cycleId filter to the request
    const filters = request.filters ? [...request.filters] : [];
    filters.push({ field: 'cycleId', operator: 'equals', value: cycleId });
    
    const searchRequest: SearchRequest = {
      ...request,
      filters,
      eagerLoad: ['member', 'agent']
    };

    this.contributionsService.searchContributions(searchRequest).subscribe({
      next: (response) => {
        this.contributions.set(response.items);
        this.contributionsData.set(response);
        this.contributionsLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to search contributions:', error);
        this.contributionsLoading.set(false);
      }
    });
  }

  setActiveTab(tabId: TabId): void {
    this.activeTab.set(tabId);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabId },
      queryParamsHandling: 'merge'
    });
  }

  goBack(): void {
    this.router.navigate(['/death-claims']);
  }

  // Document selection
  toggleDocumentSelection(documentId: string): void {
    const selected = new Set(this.selectedDocuments());
    if (selected.has(documentId)) {
      selected.delete(documentId);
    } else {
      selected.add(documentId);
    }
    this.selectedDocuments.set(selected);
  }

  selectAllPendingDocuments(): void {
    const pending = this.pendingDocuments();
    this.selectedDocuments.set(new Set(pending.map(d => d.documentId)));
  }

  clearDocumentSelection(): void {
    this.selectedDocuments.set(new Set());
  }

  isDocumentSelected(documentId: string): boolean {
    return this.selectedDocuments().has(documentId);
  }

  // Bulk verify documents
  bulkVerifyDocuments(): void {
    const selected = Array.from(this.selectedDocuments());
    if (selected.length === 0) return;

    this.actionLoading.set(true);
    let completed = 0;
    let errors = 0;

    selected.forEach(documentId => {
      this.claimsService.verifyDocument(this.claimId(), documentId, {
        verificationStatus: 'Verified',
        notes: this.verificationNotes() || undefined
      }).subscribe({
        next: () => {
          completed++;
          if (completed + errors === selected.length) {
            this.finishBulkVerify(completed, errors);
          }
        },
        error: () => {
          errors++;
          if (completed + errors === selected.length) {
            this.finishBulkVerify(completed, errors);
          }
        }
      });
    });
  }

  private finishBulkVerify(completed: number, errors: number): void {
    this.actionLoading.set(false);
    this.selectedDocuments.set(new Set());
    this.verificationNotes.set('');
    this.loadDocuments();
    this.loadClaim();

    if (errors === 0) {
      this.toastService.success('Documents Verified', `${completed} document(s) verified successfully`);
    } else {
      this.toastService.warning('Partial Success', `${completed} verified, ${errors} failed`);
    }
  }

  // Single document actions
  verifyDocument(document: DeathClaimDocument): void {
    this.actionLoading.set(true);
    this.claimsService.verifyDocument(this.claimId(), document.documentId, {
      verificationStatus: 'Verified'
    }).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.loadDocuments();
        this.loadClaim();
        this.toastService.success('Document Verified', `${document.documentName} has been verified`);
      },
      error: (error) => {
        this.actionLoading.set(false);
        this.toastService.error('Error', 'Failed to verify document');
      }
    });
  }

  rejectDocument(document: DeathClaimDocument): void {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    this.actionLoading.set(true);
    this.claimsService.verifyDocument(this.claimId(), document.documentId, {
      verificationStatus: 'Rejected',
      rejectionReason: reason
    }).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.loadDocuments();
        this.loadClaim();
        this.toastService.success('Document Rejected', `${document.documentName} has been rejected`);
      },
      error: (error) => {
        this.actionLoading.set(false);
        this.toastService.error('Error', 'Failed to reject document');
      }
    });
  }

  downloadDocument(document: DeathClaimDocument): void {
    this.claimsService.downloadDocument(this.claimId(), document.documentId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = document.documentName;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Failed to download document:', error);
        this.toastService.error('Error', 'Failed to download document');
      }
    });
  }

  // Contribution actions
  acknowledgeContribution(contribution: MemberContribution): void {
    this.actionLoading.set(true);
    this.contributionsService.acknowledgeContribution(contribution.contributionId).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.loadContributions(contribution.cycleId);
        this.toastService.success('Acknowledged', 'Contribution acknowledged successfully');
      },
      error: (error) => {
        this.actionLoading.set(false);
        this.toastService.error('Error', 'Failed to acknowledge contribution');
      }
    });
  }

  recordCashPayment(contribution: MemberContribution): void {
    const reference = prompt('Enter cash receipt reference (optional):');
    
    this.actionLoading.set(true);
    this.contributionsService.recordCashContribution(contribution.contributionId, {
      cashReceiptReference: reference || undefined
    }).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.loadContributions(contribution.cycleId);
        this.toastService.success('Cash Recorded', 'Cash payment recorded successfully');
      },
      error: (error) => {
        this.actionLoading.set(false);
        this.toastService.error('Error', 'Failed to record cash payment');
      }
    });
  }

  markContributionMissed(contribution: MemberContribution): void {
    if (!confirm('Mark this contribution as missed?')) return;

    this.actionLoading.set(true);
    this.contributionsService.markContributionMissed(contribution.contributionId).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.loadContributions(contribution.cycleId);
        this.toastService.success('Marked Missed', 'Contribution marked as missed');
      },
      error: (error) => {
        this.actionLoading.set(false);
        this.toastService.error('Error', 'Failed to mark contribution as missed');
      }
    });
  }

  // Helper methods
  getStatusColor(status: ClaimStatus): string {
    switch (status) {
      case 'Reported':
      case 'UnderVerification':
        return 'bg-red-100 text-red-800';
      case 'Verified':
      case 'PendingApproval':
        return 'bg-yellow-100 text-yellow-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Settled':
        return 'bg-blue-100 text-blue-800';
      case 'Rejected':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: ClaimStatus): string {
    switch (status) {
      case 'UnderVerification': return 'Under Verification';
      case 'PendingApproval': return 'Pending Approval';
      default: return status;
    }
  }

  getDocumentStatusColor(status: DocumentVerificationStatus): string {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Verified':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getContributionStatusColor(status: string): string {
    switch (status) {
      case 'Pending':
      case 'WalletDebitRequested':
        return 'bg-yellow-100 text-yellow-800';
      case 'Acknowledged':
      case 'Collected':
        return 'bg-green-100 text-green-800';
      case 'Missed':
        return 'bg-red-100 text-red-800';
      case 'Exempted':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getDocumentTypeLabel(type: string): string {
    switch (type) {
      case 'DeathCertificate': return 'Death Certificate';
      case 'NewspaperClipping': return 'Newspaper Clipping';
      case 'PoliceReport': return 'Police Report';
      case 'MedicalReport': return 'Medical Report';
      case 'PostMortemReport': return 'Post Mortem Report';
      default: return type;
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // Modal handlers
  openUploadModal(): void {
    this.showUploadModal.set(true);
  }

  closeUploadModal(): void {
    this.showUploadModal.set(false);
  }

  onDocumentUploaded(document: DeathClaimDocument): void {
    this.documents.update(docs => [...docs, document]);
    this.closeUploadModal();
  }

  openAcknowledgeModal(contribution: MemberContribution): void {
    this.selectedContribution.set(contribution);
    this.showAcknowledgeModal.set(true);
  }

  closeAcknowledgeModal(): void {
    this.showAcknowledgeModal.set(false);
    this.selectedContribution.set(null);
  }

  onContributionAcknowledged(contribution: MemberContribution): void {
    this.contributions.update(contribs => 
      contribs.map(c => c.contributionId === contribution.contributionId ? contribution : c)
    );
    this.closeAcknowledgeModal();
  }

  openRecordCashModal(contribution: MemberContribution): void {
    this.selectedContribution.set(contribution);
    this.showRecordCashModal.set(true);
  }

  closeRecordCashModal(): void {
    this.showRecordCashModal.set(false);
    this.selectedContribution.set(null);
  }

  onCashRecorded(contribution: MemberContribution): void {
    this.contributions.update(contribs => 
      contribs.map(c => c.contributionId === contribution.contributionId ? contribution : c)
    );
    this.closeRecordCashModal();
  }

  // Submit for Approval Modal
  openSubmitApprovalModal(): void {
    this.showSubmitApprovalModal.set(true);
  }

  closeSubmitApprovalModal(): void {
    this.showSubmitApprovalModal.set(false);
  }

  onClaimSubmitted(updatedClaim: DeathClaim): void {
    this.claim.set(updatedClaim);
    this.closeSubmitApprovalModal();
  }
}
