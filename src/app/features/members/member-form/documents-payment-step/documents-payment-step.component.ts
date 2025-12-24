import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/select/select.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { MemberService } from '../../../../core/services/member.service';
import { FileUploadService, FileUploadResult } from '../../../../core/services/file-upload.service';
import {
  MemberDocument,
  MemberPayment,
  DocumentType,
  DocumentCategory,
  CollectionMode
} from '../../../../shared/models/member.model';

@Component({
  selector: 'app-documents-payment-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputComponent,
    SelectComponent,
    ButtonComponent
  ],
  templateUrl: './documents-payment-step.component.html',
  styleUrl: './documents-payment-step.component.css'
})
export class DocumentsPaymentStepComponent implements OnInit {
  @Input() memberId!: string;
  
  @Output() back = new EventEmitter<void>();
  @Output() submit = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private memberService = inject(MemberService);
  private fileUploadService = inject(FileUploadService);

  documents = signal<MemberDocument[]>([]);
  payment = signal<MemberPayment | null>(null);
  loading = signal(false);
  uploadingFile = signal(false);

  documentForm!: FormGroup;
  paymentForm!: FormGroup;

  documentTypeOptions = signal<SelectOption<DocumentType>[]>([]);
  documentCategoryOptions = signal<SelectOption<DocumentCategory>[]>([]);
  collectionModeOptions = signal<SelectOption<CollectionMode>[]>([]);

  selectedFile: File | null = null;

  ngOnInit(): void {
    this.initializeForms();
    this.loadMetadata();
    this.loadDocuments();
    this.loadPayment();
  }

  private initializeForms(): void {
    this.documentForm = this.fb.group({
      documentType: ['', Validators.required],
      documentCategory: ['', Validators.required],
      documentName: ['', Validators.required],
      expiryDate: ['']
    });

    const today = new Date().toISOString().split('T')[0];
    this.paymentForm = this.fb.group({
      registrationFee: [0, [Validators.required, Validators.min(0)]],
      advanceDeposit: [0, [Validators.required, Validators.min(0)]],
      collectedBy: ['', Validators.required],
      collectionDate: [today, Validators.required],
      collectionMode: ['', Validators.required],
      referenceNumber: ['']
    });
  }

  private loadMetadata(): void {
    this.memberService.getDocumentTypes().subscribe({
      next: (options) => {
        this.documentTypeOptions.set(options as SelectOption<DocumentType>[]);
      },
      error: () => {}
    });

    this.memberService.getDocumentCategories().subscribe({
      next: (options) => {
        this.documentCategoryOptions.set(options as SelectOption<DocumentCategory>[]);
      },
      error: () => {}
    });

    this.memberService.getCollectionModes().subscribe({
      next: (options) => {
        this.collectionModeOptions.set(options as SelectOption<CollectionMode>[]);
      },
      error: () => {}
    });
  }

  private loadDocuments(): void {
    this.memberService.getDocuments(this.memberId).subscribe({
      next: (documents) => {
        this.documents.set(documents);
      },
      error: () => {}
    });
  }

  private loadPayment(): void {
    this.memberService.getPayment(this.memberId).subscribe({
      next: (payment) => {
        this.payment.set(payment);
        if (payment) {
          this.paymentForm.patchValue(payment);
        }
      },
      error: () => {
        // Payment not recorded yet - this is OK
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const validation = this.fileUploadService.validateFile(file);
      
      if (!validation.valid) {
        alert(validation.error);
        input.value = '';
        return;
      }
      
      this.selectedFile = file;
    }
  }

  onUploadDocument(): void {
    if (this.documentForm.invalid || !this.selectedFile) {
      Object.keys(this.documentForm.controls).forEach(key => {
        this.documentForm.controls[key].markAsTouched();
      });
      if (!this.selectedFile) {
        alert('Please select a file to upload');
      }
      return;
    }

    this.uploadingFile.set(true);
    
    this.fileUploadService.uploadFile(this.selectedFile, this.memberId).subscribe({
      next: (uploadResult: FileUploadResult) => {
        const formValue = this.documentForm.value;
        
        this.memberService.uploadDocument(this.memberId, {
          documentType: formValue.documentType,
          documentCategory: formValue.documentCategory,
          documentName: formValue.documentName,
          fileUrl: uploadResult.fileUrl,
          fileSize: uploadResult.fileSize,
          mimeType: uploadResult.mimeType,
          expiryDate: formValue.expiryDate || undefined
        }).subscribe({
          next: () => {
            this.loadDocuments();
            this.documentForm.reset();
            this.selectedFile = null;
            this.uploadingFile.set(false);
            
            // Reset file input
            const fileInput = document.getElementById('file-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
          },
          error: () => {
            this.uploadingFile.set(false);
          }
        });
      },
      error: (error) => {
        alert(error.message || 'File upload failed');
        this.uploadingFile.set(false);
      }
    });
  }

  onDeleteDocument(documentId: string): void {
    if (confirm('Are you sure you want to delete this document?')) {
      this.loading.set(true);
      this.memberService.deleteDocument(this.memberId, documentId).subscribe({
        next: () => {
          this.loadDocuments();
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
    }
  }

  onSavePayment(): void {
    if (this.paymentForm.invalid) {
      Object.keys(this.paymentForm.controls).forEach(key => {
        this.paymentForm.controls[key].markAsTouched();
      });
      return;
    }

    this.loading.set(true);
    const formValue = this.paymentForm.value;
    
    this.memberService.recordPayment(this.memberId, formValue).subscribe({
      next: () => {
        this.loadPayment();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onSubmitRegistration(): void {
    if (this.documents().length === 0) {
      alert('Please upload at least one document before submitting.');
      return;
    }

    if (!this.payment()) {
      alert('Please record payment details before submitting.');
      return;
    }

    this.loading.set(true);
    this.memberService.submitRegistration(this.memberId).subscribe({
      next: () => {
        this.loading.set(false);
        this.submit.emit();
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onBack(): void {
    this.back.emit();
  }

  get totalAmount(): number {
    const fee = this.paymentForm.get('registrationFee')?.value || 0;
    const deposit = this.paymentForm.get('advanceDeposit')?.value || 0;
    return fee + deposit;
  }

  getDocumentFieldError(fieldName: string): string {
    const control = this.documentForm.get(fieldName);
    if (!control || !control.touched || !control.errors) return '';

    const errors = control.errors;
    if (errors['required']) return `${this.getFieldLabel(fieldName)} is required`;

    return '';
  }

  getPaymentFieldError(fieldName: string): string {
    const control = this.paymentForm.get(fieldName);
    if (!control || !control.touched || !control.errors) return '';

    const errors = control.errors;
    if (errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
    if (errors['min']) return `Minimum value is ${errors['min'].min}`;

    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      documentType: 'Document Type',
      documentCategory: 'Document Category',
      documentName: 'Document Name',
      registrationFee: 'Registration Fee',
      advanceDeposit: 'Advance Deposit',
      collectedBy: 'Collected By',
      collectionDate: 'Collection Date',
      collectionMode: 'Collection Mode'
    };
    return labels[fieldName] || fieldName;
  }

  getAllowedFileTypes(): string {
    return this.fileUploadService.getAllowedFileTypes();
  }
}
