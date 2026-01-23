import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { MemberService } from '../../../../../core/services/member.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { MemberDocument, MemberProfile, MemberSelfProfile } from '../../../../../shared/models/member.model';
import { DevInProgressModalComponent } from '../../../../agents/agent-profile/modals/dev-in-progress-modal/dev-in-progress-modal.component';
import { AccessService } from '../../../../../core/services/access.service';
import { ButtonComponent } from "../../../../../shared/components/button/button.component";

export type MemberViewMode = 'self' | 'agent' | 'admin';

@Component({
  selector: 'app-member-documents-tab',
  standalone: true,
  imports: [CommonModule, DevInProgressModalComponent, ButtonComponent],
  templateUrl: './member-documents-tab.component.html',
  styleUrls: ['./member-documents-tab.component.css']
})
export class MemberDocumentsTabComponent implements OnInit {
  private memberService = inject(MemberService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private accessService = inject(AccessService);

  // State
  profile = signal<MemberProfile | MemberSelfProfile | null>(null);
  loading = signal(true);
  viewMode = this.accessService.viewMode
  showDevModal = signal(false);
  devModalFeature = signal('');
  verifyingDocId = signal<string | null>(null);

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
          this.toastService.error('Failed to load documents', error?.error?.message || 'Please try again');
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
            this.toastService.error('Failed to load documents', error?.error?.message || 'Please try again');
          }
        });
      }
    }
  }

  onUploadDocument(): void {
    this.showDevModal.set(true);
    this.devModalFeature.set('Upload Document');
  }

  onViewDocument(doc: MemberDocument): void {
    if (doc.documentUrl) {
      window.open(doc.documentUrl, '_blank');
    }
  }

  onVerifyDocument(doc: MemberDocument): void {
    const memberId = this.route.parent?.snapshot.paramMap.get('memberId');
    if (!memberId || !doc.documentId) return;

    this.verifyingDocId.set(doc.documentId);
    this.memberService.verifyDocument(memberId, doc.documentId).subscribe({
      next: () => {
        this.toastService.success('Document verified', 'The document has been verified successfully');
        this.loadProfile();
        this.verifyingDocId.set(null);
      },
      error: (error) => {
        this.verifyingDocId.set(null);
        this.toastService.error('Verification failed', error?.error?.message || 'Please try again');
      }
    });
  }

  onUnverifyDocument(doc: MemberDocument): void {
    const memberId = this.route.parent?.snapshot.paramMap.get('memberId');
    if (!memberId || !doc.documentId) return;

    this.verifyingDocId.set(doc.documentId);
    this.memberService.unverifyDocument(memberId, doc.documentId).subscribe({
      next: () => {
        this.toastService.success('Verification removed', 'The document verification has been removed');
        this.loadProfile();
        this.verifyingDocId.set(null);
      },
      error: (error) => {
        this.verifyingDocId.set(null);
        this.toastService.error('Failed to unverify', error?.error?.message || 'Please try again');
      }
    });
  }

  onDeleteDocument(doc: MemberDocument): void {
    this.showDevModal.set(true);
    this.devModalFeature.set('Delete Document');
  }

  closeDevModal(): void {
    this.showDevModal.set(false);
    this.devModalFeature.set('');
  }

  getDocumentTypeIcon(docType: string): string {
    const type = docType?.toLowerCase() || '';
    if (type.includes('aadhaar') || type.includes('aadhar')) return '🪪';
    if (type.includes('pan')) return '💳';
    if (type.includes('passport')) return '📘';
    if (type.includes('photo')) return '📸';
    if (type.includes('bank')) return '🏦';
    return '📄';
  }

  getStatusBadgeClass(isVerified: boolean): string {
    return isVerified 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
  }
}
