import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

import { BreadcrumbsComponent, BreadcrumbItem } from '../../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { MemberQuickInfoCardComponent } from '../../components/member-quick-info-card/member-quick-info-card.component';
import { MemberService } from '../../../../../core/services/member.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { MemberSelfProfile } from '../../../../../shared/models/member.model';
import { DevInProgressModalComponent } from '../../../../../shared/components/dev-in-progress-modal/dev-in-progress-modal.component';
import { ButtonComponent } from "../../../../../shared/components/button/button.component";

type TabType = 'overview' | 'contributions' | 'nominees' | 'documents';

interface TabItem {
  key: TabType;
  label: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbsComponent,
    MemberQuickInfoCardComponent,
    DevInProgressModalComponent,
    ButtonComponent
],
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.css']
})
export class MyProfileComponent implements OnInit {
  private memberService = inject(MemberService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // State
  profile = signal<MemberSelfProfile | null>(null);
  loading = signal(true);
  activeTab = signal<TabType>('overview');
  showDevModal = signal(false);
  devModalFeature = signal('');

  // Breadcrumbs
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', route: '/' },
    { label: 'My Profile', route: '' }
  ];

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
    return [p.addressLine1, p.addressLine2, p.city, p.state, p.postalCode, p.country].filter(Boolean).join(', ');
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
    this.loadProfile();
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

  private loadProfile(): void {
    this.loading.set(true);
    this.memberService.getMyProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.loading.set(false);
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

  openEditModal(): void {
    this.showDevModal.set(true);
    this.devModalFeature.set('Edit My Profile');
  }

  closeDevModal(): void {
    this.showDevModal.set(false);
    this.devModalFeature.set('');
  }

  onViewWallet(): void {
    this.router.navigate(['/my-wallet']);
  }
}
