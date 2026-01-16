import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { MemberService } from '../../../../../core/services/member.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { MemberProfile, MemberSelfProfile } from '../../../../../shared/models/member.model';

export type MemberViewMode = 'self' | 'agent' | 'admin';

@Component({
  selector: 'app-member-overview-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './member-overview-tab.component.html',
  styleUrls: ['./member-overview-tab.component.css']
})
export class MemberOverviewTabComponent implements OnInit {
  private memberService = inject(MemberService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // State
  profile = signal<MemberProfile | MemberSelfProfile | null>(null);
  loading = signal(true);
  viewMode = signal<MemberViewMode>('self');

  // Computed values
  fullName = computed(() => {
    const p = this.profile();
    if (!p) return '';
    return [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ');
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

  ngOnInit(): void {
    this.detectViewMode();
    this.loadProfile();
  }

  private detectViewMode(): void {
    const url = this.router.url;
    if (url.includes('/my-profile')) {
      this.viewMode.set('self');
    } else if (url.includes('/agents/members/')) {
      this.viewMode.set('agent');
    } else if (url.includes('/admin/members/')) {
      this.viewMode.set('admin');
    }
  }

  private loadProfile(): void {
    this.loading.set(true);
    
    if (this.viewMode() === 'self') {
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
    } else {
      const memberId = this.route.parent?.snapshot.paramMap.get('memberId');
      if (memberId) {
        this.memberService.getMemberProfile(memberId).subscribe({
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
    }
  }
}
