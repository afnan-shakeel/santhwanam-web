import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/select/select.component';
import { DeathClaimsService } from '../../../../core/services/death-claims.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ClaimDocumentType, DeathClaimDocument } from '../../../../shared/models/death-claim.model';

@Component({
  selector: 'app-document-upload-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    SelectComponent
  ],
  templateUrl: './document-upload-modal.component.html',
  styleUrls: ['./document-upload-modal.component.css']
})
export class DocumentUploadModalComponent {
  private fb = inject(FormBuilder);
  private claimsService = inject(DeathClaimsService);
  private toastService = inject(ToastService);

  @Input({ required: true }) claimId!: string;
  @Output() closeModal = new EventEmitter<void>();
  @Output() documentUploaded = new EventEmitter<DeathClaimDocument>();

  submitting = signal(false);
  error = signal<string | null>(null);
  selectedFile = signal<File | null>(null);
  isDragOver = signal(false);

  documentTypes: SelectOption<ClaimDocumentType>[] = [
    { value: 'DeathCertificate', label: 'Death Certificate' },
    { value: 'IdProof', label: 'ID Proof' },
    { value: 'BankStatement', label: 'Bank Statement' },
    { value: 'MembershipCard', label: 'Membership Card' },
    { value: 'NomineeIdProof', label: 'Nominee ID Proof' },
    { value: 'Other', label: 'Other' }
  ];

  uploadForm: FormGroup = this.fb.group({
    documentType: ['', [Validators.required]],
    description: ['']
  });

  readonly allowedFileTypes = '.pdf,.jpg,.jpeg,.png';
  readonly maxFileSizeMB = 5;

  onClose(): void {
    this.closeModal.emit();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileSelection(input.files[0]);
    }
  }

  private handleFileSelection(file: File): void {
    // Validate file size
    const maxSize = this.maxFileSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      this.error.set(`File size exceeds ${this.maxFileSizeMB}MB limit`);
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      this.error.set('File type not allowed. Please upload PDF, JPEG, or PNG files.');
      return;
    }

    this.error.set(null);
    this.selectedFile.set(file);
  }

  removeFile(): void {
    this.selectedFile.set(null);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  onSubmit(): void {
    if (this.uploadForm.invalid || !this.selectedFile()) {
      this.uploadForm.markAllAsTouched();
      if (!this.selectedFile()) {
        this.error.set('Please select a file to upload');
      }
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const formValue = this.uploadForm.value;
    const file = this.selectedFile()!;
    const documentName = formValue.description || file.name;

    this.claimsService.uploadDocument(
      this.claimId,
      formValue.documentType,
      documentName,
      file,
      file.type // mimeType
    ).subscribe({
      next: (response) => {
        this.submitting.set(false);
        this.toastService.show({
          type: 'success',
          title: 'Document Uploaded',
          message: 'Document has been uploaded successfully.'
        });
        this.documentUploaded.emit(response.data);
        this.onClose();
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err.message || 'Failed to upload document');
        this.toastService.show({
          type: 'error',
          title: 'Upload Failed',
          message: err.message || 'Failed to upload document'
        });
      }
    });
  }
}
