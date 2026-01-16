import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { MemberService } from '../../../../../core/services/member.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { Nominee, MemberProfile, MemberSelfProfile } from '../../../../../shared/models/member.model';
import { NomineeCardComponent } from '../../components/nominee-card/nominee-card.component';
import { DevInProgressModalComponent } from '../../../../agents/agent-profile/modals/dev-in-progress-modal/dev-in-progress-modal.component';

export type MemberViewMode = 'self' | 'agent' | 'admin';

@Component({
  selector: 'app-member-nominees-tab',
  standalone: true,
  imports: [CommonModule, NomineeCardComponent, DevInProgressModalComponent],
  templateUrl: './member-nominees-tab.component.html',
  styleUrls: ['./member-nominees-tab.component.css']
})
export class MemberNomineesTabComponent implements OnInit {
  private memberService = inject(MemberService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // State
  profile = signal<MemberProfile | MemberSelfProfile | null>(null);
  loading = signal(true);
  viewMode = signal<MemberViewMode>('self');
  showDevModal = signal(false);
  devModalFeature = signal('');

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
          this.toastService.error('Failed to load nominees', error?.error?.message || 'Please try again');
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
            this.toastService.error('Failed to load nominees', error?.error?.message || 'Please try again');
          }
        });
      }
    }
  }

  onAddNominee(): void {
    this.showDevModal.set(true);
    this.devModalFeature.set('Add Nominee');
  }

  onEditNominee(nominee: Nominee): void {
    this.showDevModal.set(true);
    this.devModalFeature.set('Edit Nominee');
  }

  onDeleteNominee(nominee: Nominee): void {
    this.showDevModal.set(true);
    this.devModalFeature.set('Delete Nominee');
  }

  closeDevModal(): void {
    this.showDevModal.set(false);
    this.devModalFeature.set('');
  }

  getTotalSharePercentage(): number {
    const nominees = this.profile()?.nominees;
    if (!nominees || nominees.length === 0) return 0;
    return nominees.reduce((sum: number, n: Nominee) => sum + (n.sharePercentage || 0), 0);
  }
}
