import { Component, input, output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DeathClaimDocument, DocumentVerificationStatus } from '../../../../shared/models/death-claim.model';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './document-list.component.html'
})
export class DocumentListComponent {
  documents = input.required<DeathClaimDocument[]>();
  canVerify = input(false);
  canUpload = input(false);

  viewDocument = output<DeathClaimDocument>();
  verifyDocument = output<DeathClaimDocument>();
  rejectDocument = output<DeathClaimDocument>();
  uploadClick = output<void>();

  getDocIcon(doc: DeathClaimDocument): string {
    const mimeType = doc.mimeType || '';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    return '📎';
  }

  getFileSize(bytes: number | undefined): string {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  getStatusBadgeClass(status: DocumentVerificationStatus): string {
    switch (status) {
      case 'Verified': return 'bg-green-50 text-green-700';
      case 'Rejected': return 'bg-red-50 text-red-700';
      case 'Pending': return 'bg-amber-50 text-amber-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  }
}
