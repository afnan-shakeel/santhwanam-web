import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { BackButtonComponent } from '../../../../../shared/components/back-button/back-button.component';
import { MemberQuickInfoCardComponent } from '../../components/member-quick-info-card/member-quick-info-card.component';
import { PendingCollectionAlertComponent, PendingContribution } from '../../components/pending-collection-alert/pending-collection-alert.component';
import { MemberService } from '../../../../../core/services/member.service';
import { ContributionsService } from '../../../../../core/services/contributions.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { MemberProfile } from '../../../../../shared/models/member.model';
import { RecordDepositModalComponent } from '../../../../wallet/components/record-deposit-modal/record-deposit-modal.component';

type TabType = 'overview' | 'contributions' | 'nominees' | 'documents';

interface TabItem {
  key: TabType;
  label: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-agent-member-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbsComponent,
    BackButtonComponent,
    MemberQuickInfoCardComponent,
    PendingCollectionAlertComponent,
    RecordDepositModalComponent
  ],
  templateUrl: './agent-member-profile.component.html',
  styleUrls: ['./agent-member-profile.component.css']
})
export class AgentMemberProfileComponent implements OnInit {
  private memberService = inject(MemberService);
  private contributionsService = inject(ContributionsService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // State
  memberId = signal<string>('');
  profile = signal<MemberProfile | null>(null);
  loading = signal(true);
  activeTab = signal<TabType>('overview');
  pendingContributions = signal<PendingContribution[]>([]);
  loadingPending = signal(false);
  showRecordDepositModal = signal(false);

  // Breadcrumbs
  breadcrumbs = signal<BreadcrumbItem[]>([
    { label: 'Home', route: '/' },
    { label: 'Agent Profile', route: '/agent/profile' },
    { label: 'Members', route: '/agent/profile/members' },
    { label: 'Member Profile', route: '' }
  ]);

  // Tabs
  tabs: TabItem[] = [
    { key: 'overview', label: 'Overview', route: 'overview' },
    { key: 'contributions', label: 'Contributions', route: 'contributions' },
    { key: 'nominees', label: 'Nominees', route: 'nominees' },
    { key: 'documents', label: 'Documents', route: 'documents' }
  ];

  // Computed values
  fullName = computed(() => {
    const p = this.profile();
    if (!p) return '';
    return [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ');
  });

  initials = computed(() => {
    const name = this.fullName();
    if (!name) return '';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  });

  fullAddress = computed(() => {
    const p = this.profile();
    if (!p) return '';
    return [p.addressLine1, p.addressLine2, p.state, p.postalCode, p.country].filter(Boolean).join(', ');
  });

  age = computed(() => {
    const dob = this.profile()?.dateOfBirth;
    if (!dob) return 0;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  });

  memberStatusColor = computed(() => {
    const status = this.profile()?.memberStatus;
    switch (status) {
      case 'Active': return 'success';
      case 'Suspended': return 'warning';
      case 'Frozen': return 'secondary';
      case 'Closed': return 'neutral';
      case 'Deceased': return 'neutral';
      default: return 'neutral';
    }
  });

  ngOnInit(): void {
    const memberId = this.route.snapshot.paramMap.get('memberId');
    if (memberId) {
      this.memberId.set(memberId);
      this.loadProfile(memberId);
      this.loadPendingContributions(memberId);
    }
    this.setActiveTabFromRoute();
  }

  private setActiveTabFromRoute(): void {
    this.route.url.subscribe(() => {
      const childRoute = this.route.firstChild?.snapshot.url[0]?.path;
      if (childRoute) {
        this.activeTab.set(childRoute as TabType);
      }
    });
  }

  private loadProfile(memberId: string): void {
    this.loading.set(true);
    this.memberService.getMemberProfile(memberId).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.loading.set(false);
        // Update breadcrumbs with member name
        this.breadcrumbs.set([
          { label: 'Home', route: '/' },
          { label: 'Agent Profile', route: '/agent/profile' },
          { label: 'Members', route: '/agent/profile/members' },
          { label: this.fullName() || 'Member Profile', route: '' }
        ]);
      },
      error: (error) => {
        this.loading.set(false);
        this.toastService.error('Failed to load profile', error?.error?.message || 'Please try again');
      }
    });
  }

  private loadPendingContributions(memberId: string): void {
    this.loadingPending.set(true);
    this.contributionsService.getMemberContributionHistory(memberId, { status: 'Pending' }).subscribe({
      next: (response) => {
        // Map to PendingContribution format
        const pending: PendingContribution[] = (response?.contributions || []).map((c: any) => ({
          contributionId: c.contributionId,
          cycleId: c.cycleId,
          cycleNumber: c.cycle?.cycleNumber || '',
          deceasedName: c.cycle?.deceasedMemberName || '',
          deceasedMemberCode: c.cycle?.deceasedMemberCode || '',
          amount: c.expectedAmount || 0,
          deadline: c.cycle?.collectionDeadline || '',
          daysRemaining: this.calculateDaysRemaining(c.cycle?.collectionDeadline || ''),
          status: c.contributionStatus || 'Pending'
        }));
        this.pendingContributions.set(pending);
        this.loadingPending.set(false);
      },
      error: () => {
        this.loadingPending.set(false);
      }
    });
  }

  private calculateDaysRemaining(deadline: string): number {
    if (!deadline) return 0;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  setActiveTab(tab: TabType): void {
    this.activeTab.set(tab);
    this.router.navigate([tab], { relativeTo: this.route });
  }

  goBack(): void {
    this.router.navigate(['/agent/profile/members']);
  }

  onViewWallet(): void {
    this.router.navigate(['/agents/members', this.memberId(), 'wallet'])
  }

  onRecordDeposit(): void {
    this.showRecordDepositModal.set(true);
  }

  closeRecordDepositModal(): void {
    this.showRecordDepositModal.set(false);
  }

  onDepositRecorded(): void {
    this.showRecordDepositModal.set(false);
    this.toastService.success('Deposit recorded', 'The deposit has been recorded and submitted for approval.');
    // Optionally, refresh pending contributions or profile data here
    this.loadPendingContributions(this.memberId());
    this.loadProfile(this.memberId());
  }

  onCollectContribution(contribution: PendingContribution): void {
    // Navigate to contribution collection page
    this.router.navigate(['/contributions', contribution.contributionId, 'collect']);
  }
}
