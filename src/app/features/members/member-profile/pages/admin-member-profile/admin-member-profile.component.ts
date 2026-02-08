import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { MemberQuickInfoCardComponent } from '../../components/member-quick-info-card/member-quick-info-card.component';
import { MemberService } from '../../../../../core/services/member.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { MemberProfile } from '../../../../../shared/models/member.model';
import { DevInProgressModalComponent } from '../../../../../shared/components/dev-in-progress-modal/dev-in-progress-modal.component';
import { ButtonComponent } from "../../../../../shared/components/button/button.component";

type TabType = 'overview' | 'contributions' | 'nominees' | 'documents' | 'activity';

interface TabItem {
  key: TabType;
  label: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-admin-member-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbsComponent,
    MemberQuickInfoCardComponent,
    DevInProgressModalComponent,
    ButtonComponent
],
  templateUrl: './admin-member-profile.component.html',
  styleUrls: ['./admin-member-profile.component.css']
})
export class AdminMemberProfileComponent implements OnInit {
  private memberService = inject(MemberService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // State
  memberId = signal<string>('');
  profile = signal<MemberProfile | null>(null);
  loading = signal(true);
  activeTab = signal<TabType>('overview');
  showActionsDropdown = signal(false);
  showDevModal = signal(false);
  devModalFeature = signal('');

  // Breadcrumbs
  breadcrumbs = signal<BreadcrumbItem[]>([
    { label: 'Home', route: '/' },
    { label: 'Members', route: '/members' },
    { label: 'Member Profile', route: '' }
  ]);

  // Tabs
  tabs: TabItem[] = [
    { key: 'overview', label: 'Overview', route: 'overview' },
    { key: 'contributions', label: 'Contributions', route: 'contributions' },
    { key: 'nominees', label: 'Nominees', route: 'nominees' },
    { key: 'documents', label: 'Documents', route: 'documents' },
    { key: 'activity', label: 'Activity', route: 'activity' }
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

  isActive = computed(() => this.profile()?.memberStatus === 'Active');
  isSuspended = computed(() => this.profile()?.memberStatus === 'Suspended');

  ngOnInit(): void {
    const memberId = this.route.snapshot.paramMap.get('memberId');
    if (memberId) {
      this.memberId.set(memberId);
      this.loadProfile(memberId);
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
          { label: 'Members', route: '/members' },
          { label: this.fullName() || 'Member Profile', route: '' }
        ]);
      },
      error: (error) => {
        this.loading.set(false);
        this.toastService.error('Failed to load profile', error?.error?.message || 'Please try again');
      }
    });
  }

  setActiveTab(tab: TabType): void {
    this.activeTab.set(tab);
    this.router.navigate([tab], { relativeTo: this.route });
  }

  goBack(): void {
    this.router.navigate(['/members']);
  }

  toggleActionsDropdown(): void {
    this.showActionsDropdown.update(v => !v);
  }

  closeActionsDropdown(): void {
    this.showActionsDropdown.set(false);
  }

  onEdit(): void {
    this.showDevModal.set(true);
    this.devModalFeature.set('Edit Member Profile (Admin)');
    this.closeActionsDropdown();
  }

  onSuspend(): void {
    this.showDevModal.set(true);
    this.devModalFeature.set('Suspend Member');
    this.closeActionsDropdown();
  }

  onReactivate(): void {
    this.showDevModal.set(true);
    this.devModalFeature.set('Reactivate Member');
    this.closeActionsDropdown();
  }

  onClose(): void {
    this.showDevModal.set(true);
    this.devModalFeature.set('Close Membership');
    this.closeActionsDropdown();
  }

  onReassignAgent(): void {
    this.showDevModal.set(true);
    this.devModalFeature.set('Reassign Agent');
  }

  onViewWallet(): void {
    this.router.navigate(['/admin/wallets', this.profile()?.wallet?.walletId]);
  }

  closeDevModal(): void {
    this.showDevModal.set(false);
    this.devModalFeature.set('');
  }
}
