import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { MemberService } from '../../../../../core/services/member.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { Nominee, MemberProfile, MemberSelfProfile } from '../../../../../shared/models/member.model';
import { NomineeCardComponent } from '../../components/nominee-card/nominee-card.component';
import { DevInProgressModalComponent } from '../../../../agents/agent-profile/modals/dev-in-progress-modal/dev-in-progress-modal.component';
import { AccessService } from '../../../../../core/services/access.service';


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
  private accessService = inject(AccessService)
  // State
  profile = signal<MemberProfile | MemberSelfProfile | null>(null);
  loading = signal(true);
  viewMode = this.accessService.viewMode
  showDevModal = signal(false);
  devModalFeature = signal('');

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.loading.set(true);
    
    if (this.viewMode() === 'member') {
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
