import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../../shared/components/breadcrumbs/breadcrumbs.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { MemberService } from '../../../core/services/member.service';
import { ToastService } from '../../../core/services/toast.service';
import { MemberProfile } from '../../../shared/models/member.model';
import { EditMemberProfileModalComponent } from './edit-member-profile-modal/edit-member-profile-modal.component';

type TabType = 'overview' | 'contributions' | 'nominees' | 'documents';

@Component({
  selector: 'app-member-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    BreadcrumbsComponent,
    BadgeComponent,
    EditMemberProfileModalComponent
  ],
  templateUrl: './member-profile.component.html',
  styleUrls: ['./member-profile.component.css']
})
export class MemberProfileComponent implements OnInit {
  private memberService = inject(MemberService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // State
  memberId = signal<string>('');
  profile = signal<MemberProfile | null>(null);
  loading = signal(true);
  activeTab = signal<TabType>('overview');

  // Modals
  showEditModal = signal(false);
  showSuspendModal = signal(false);
  showReactivateModal = signal(false);
  showCloseModal = signal(false);
  showActionsDropdown = signal(false);

  // Breadcrumbs
  breadcrumbs = signal<BreadcrumbItem[]>([
    { label: 'Home', route: '/' },
    { label: 'Members', route: '/members' },
    { label: 'Profile', route: '' }
  ]);

  // Computed
  fullName = computed(() => {
    const profile = this.profile();
    if (!profile) return '';
    return [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(' ');
  });
  agentFullName = computed(() => {
    const profile = this.profile();
    if (!profile) return '';
    return [profile.agent?.firstName, profile.agent?.middleName, profile.agent?.lastName].filter(Boolean).join(' ');
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
    const parts = [p.addressLine1, p.addressLine2, p.state, p.postalCode, p.country].filter(Boolean);
    return parts.join(', ');
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
      case 'Deceased': return 'danger';
      default: return 'neutral';
    }
  });

  registrationStatusColor = computed(() => {
    const status = this.profile()?.registrationStatus;
    switch (status) {
      case 'Approved': return 'success';
      case 'PendingApproval': return 'warning';
      case 'Rejected': return 'danger';
      case 'Draft': return 'neutral';
      default: return 'neutral';
    }
  });

  // Computed to check if any nominee has documents
  hasNomineeDocuments = computed(() => {
    const nominees = this.profile()?.nominees;
    if (!nominees) return false;
    return nominees.some(n => n.documents && n.documents.length > 0);
  });

  ngOnInit(): void {
    const memberId = this.route.snapshot.paramMap.get('memberId');
    if (memberId) {
      this.memberId.set(memberId);
      this.loadProfile(memberId);
    } else {
      this.toastService.error('Invalid member', 'Member ID not found');
      this.router.navigate(['/members']);
    }
  }

  loadProfile(memberId: string): void {
    this.loading.set(true);
    this.memberService.getMemberProfile(memberId).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.loading.set(false);
        // Update breadcrumbs
        this.breadcrumbs.set([
          { label: 'Home', route: '/' },
          { label: 'Members', route: '/members' },
          { label: profile.fullName || 'Profile', route: '' }
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
  }

  toggleActionsDropdown(): void {
    this.showActionsDropdown.update(v => !v);
  }

  closeActionsDropdown(): void {
    this.showActionsDropdown.set(false);
  }

  // Modal openers
  openEditModal(): void {
    this.showEditModal.set(true);
    this.closeActionsDropdown();
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
  }

  openSuspendModal(): void {
    this.showSuspendModal.set(true);
    this.closeActionsDropdown();
  }

  closeSuspendModal(): void {
    this.showSuspendModal.set(false);
  }

  openReactivateModal(): void {
    this.showReactivateModal.set(true);
    this.closeActionsDropdown();
  }

  closeReactivateModal(): void {
    this.showReactivateModal.set(false);
  }

  openCloseModal(): void {
    this.showCloseModal.set(true);
    this.closeActionsDropdown();
  }

  closeCloseModal(): void {
    this.showCloseModal.set(false);
  }

  // Actions
  onSuspendMember(reason: string): void {
    const memberId = this.memberId();
    if (!memberId) return;

    this.memberService.suspendMember(memberId, reason).subscribe({
      next: () => {
        this.toastService.success('Member suspended', 'Member has been suspended successfully');
        this.closeSuspendModal();
        this.loadProfile(memberId);
      },
      error: (error) => {
        this.toastService.error('Failed to suspend', error?.error?.message || 'Please try again');
      }
    });
  }

  onReactivateMember(): void {
    const memberId = this.memberId();
    if (!memberId) return;

    this.memberService.reactivateMember(memberId).subscribe({
      next: () => {
        this.toastService.success('Member reactivated', 'Member has been reactivated successfully');
        this.closeReactivateModal();
        this.loadProfile(memberId);
      },
      error: (error) => {
        this.toastService.error('Failed to reactivate', error?.error?.message || 'Please try again');
      }
    });
  }

  onCloseMember(reason: string): void {
    const memberId = this.memberId();
    if (!memberId) return;

    this.memberService.closeMember(memberId, reason).subscribe({
      next: () => {
        this.toastService.success('Account closed', 'Member account has been closed');
        this.closeCloseModal();
        this.loadProfile(memberId);
      },
      error: (error) => {
        this.toastService.error('Failed to close account', error?.error?.message || 'Please try again');
      }
    });
  }

  onProfileUpdated(): void {
    this.closeEditModal();
    this.loadProfile(this.memberId());
    // this.toastService.success('Profile updated', 'Member profile has been updated successfully');
  }

  navigateToWallet(): void {
    this.router.navigate(['/members', this.memberId(), 'wallet']);
  }

  // Format helpers
  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatFileSize(bytes: number | undefined): string {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  getNomineeAddress(nominee: { addressLine1?: string; addressLine2?: string; state?: string; country?: string }): string {
    const parts = [nominee.addressLine1, nominee.addressLine2, nominee.state, nominee.country].filter(part => !!part);
    return parts.join(', ') || '-';
  }

  getNomineeInitials(fullName: string): string {
    if (!fullName) return '';
    const words = fullName.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  downloadDocument(fileUrl: string, fileName: string): void {
    if (!fileUrl) {
      this.toastService.error('Download failed', 'Document URL not available');
      return;
    }
    // Open the file URL in a new tab for download
    window.open(fileUrl, '_blank');
  }
}
