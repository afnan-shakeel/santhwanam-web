import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeathClaim, ClaimStatus } from '../../../../shared/models/death-claim.model';

type BannerVariant = 'reported' | 'verification' | 'approval' | 'settlement' | 'rejected' | 'settled' | 'none';

interface BannerConfig {
  variant: BannerVariant;
  icon: string;
  title: string;
  description: string;
  bgClass: string;
  borderClass: string;
  iconBgClass: string;
  actions: BannerAction[];
}

interface BannerAction {
  label: string;
  type: 'primary' | 'secondary' | 'success' | 'danger-outline';
  action: string;
}

@Component({
  selector: 'app-claim-action-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './claim-action-banner.component.html'
})
export class ClaimActionBannerComponent {
  claim = input.required<DeathClaim>();
  viewMode = input<'admin' | 'agent' | 'viewer'>('admin');

  bannerAction = output<string>();

  config = computed<BannerConfig | null>(() => {
    const claim = this.claim();
    const mode = this.viewMode();
    if (!claim) return null;

    switch (claim.claimStatus) {
      case 'Reported':
        return this.getReportedConfig(mode);
      case 'UnderVerification':
        return this.getVerificationConfig(mode);
      case 'Verified':
      case 'PendingApproval':
        return this.getApprovalConfig(mode);
      case 'Approved':
        return this.getSettlementConfig(mode, claim);
      case 'Rejected':
        return this.getRejectedConfig(mode, claim);
      case 'Settled':
        return this.getSettledConfig(claim);
      default:
        return null;
    }
  });

  onAction(action: string): void {
    this.bannerAction.emit(action);
  }

  getButtonClass(type: string): string {
    const base = 'inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer whitespace-nowrap';
    switch (type) {
      case 'primary': return `${base} bg-blue-600 text-white hover:bg-blue-700`;
      case 'secondary': return `${base} bg-white text-gray-700 border border-gray-300 hover:bg-gray-50`;
      case 'success': return `${base} bg-green-600 text-white hover:bg-green-700`;
      case 'danger-outline': return `${base} bg-transparent text-red-600 border border-red-600 hover:bg-red-50`;
      default: return base;
    }
  }

  private getReportedConfig(mode: string): BannerConfig {
    const isAgent = mode === 'agent';
    return {
      variant: 'reported',
      icon: '📝',
      title: isAgent ? 'Claim reported — upload required documents' : 'Claim reported — awaiting document upload',
      description: isAgent
        ? 'Upload the required documents (death certificate, medical report, nominee ID) to proceed.'
        : 'Agent needs to upload required documents to proceed with verification.',
      bgClass: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      borderClass: 'border-indigo-200',
      iconBgClass: 'bg-indigo-500/10',
      actions: isAgent
        ? [{ label: 'Upload Documents', type: 'primary', action: 'upload-documents' }]
        : []
    };
  }

  private getVerificationConfig(mode: string): BannerConfig {
    const isAdmin = mode === 'admin';
    return {
      variant: 'verification',
      icon: '⏳',
      title: isAdmin ? 'Documents require verification' : 'Documents are being verified',
      description: isAdmin
        ? 'Review uploaded documents and verify their authenticity before submitting for approval.'
        : 'Documents are being verified by administration.',
      bgClass: 'bg-gradient-to-br from-amber-50 to-yellow-50',
      borderClass: 'border-amber-200',
      iconBgClass: 'bg-amber-500/10',
      actions: isAdmin
        ? [
            { label: 'Request More Docs', type: 'secondary', action: 'request-docs' },
            { label: 'Verify & Send for Approval', type: 'primary', action: 'verify-and-submit' }
          ]
        : []
    };
  }

  private getApprovalConfig(mode: string): BannerConfig {
    const isAdmin = mode === 'admin';
    return {
      variant: 'approval',
      icon: '📋',
      title: isAdmin ? 'Awaiting your approval decision' : 'Claim is under management review',
      description: isAdmin
        ? 'All documents verified. Review the claim and approve or reject.'
        : 'Submitted for approval. Awaiting management decision.',
      bgClass: 'bg-gradient-to-br from-purple-50 to-violet-50',
      borderClass: 'border-purple-200',
      iconBgClass: 'bg-purple-500/10',
      actions: isAdmin
        ? [
            { label: 'Reject', type: 'danger-outline', action: 'reject' },
            { label: 'Approve Claim', type: 'success', action: 'approve' }
          ]
        : []
    };
  }

  private getSettlementConfig(mode: string, claim: DeathClaim): BannerConfig {
    const isAdmin = mode === 'admin';
    return {
      variant: 'settlement',
      icon: '💰',
      title: 'Approved — Ready for benefit payout',
      description: isAdmin
        ? 'Contribution cycle in progress. Record the settlement payment to the nominee.'
        : 'Claim approved. Contribution collection is in progress.',
      bgClass: 'bg-gradient-to-br from-green-50 to-emerald-50',
      borderClass: 'border-green-200',
      iconBgClass: 'bg-green-500/10',
      actions: isAdmin
        ? [{ label: 'Record Settlement', type: 'success', action: 'settle' }]
        : []
    };
  }

  private getRejectedConfig(mode: string, claim: DeathClaim): BannerConfig {
    const isAdmin = mode === 'admin';
    return {
      variant: 'rejected',
      icon: '✕',
      title: 'Claim Rejected',
      description: claim.rejectionReason || 'This claim has been rejected.',
      bgClass: 'bg-gradient-to-br from-red-50 to-rose-50',
      borderClass: 'border-red-200',
      iconBgClass: 'bg-red-500/10',
      actions: isAdmin
        ? [{ label: 'Reopen Claim', type: 'secondary', action: 'reopen' }]
        : []
    };
  }

  private getSettledConfig(claim: DeathClaim): BannerConfig {
    const amount = claim.benefitAmount ? `OMR ${claim.benefitAmount.toLocaleString()}` : 'benefit';
    return {
      variant: 'settled',
      icon: '✓',
      title: 'Claim Settled',
      description: `Benefit of ${amount} paid to ${claim.nomineeName || 'nominee'}.`,
      bgClass: 'bg-gradient-to-br from-green-50 to-emerald-50',
      borderClass: 'border-green-300',
      iconBgClass: 'bg-green-700/10',
      actions: [{ label: 'View Receipt', type: 'secondary', action: 'view-receipt' }]
    };
  }
}
