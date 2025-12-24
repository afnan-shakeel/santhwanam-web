import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';

export interface FileUploadResult {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * File Upload Service
 * Handles local file uploads with validation
 * Designed to be easily extended for cloud storage (AWS S3, Azure Blob, etc.) in the future
 */
@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];

  /**
   * Upload file to local storage
   * In production, this would be replaced with cloud storage upload
   */
  uploadFile(file: File, memberId: string): Observable<FileUploadResult> {
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.valid) {
      return throwError(() => new Error(validation.error));
    }

    // Simulate file upload (in real scenario, this would upload to server/cloud)
    return from(this.simulateFileUpload(file, memberId));
  }

  /**
   * Upload multiple files
   */
  uploadMultipleFiles(files: File[], memberId: string): Observable<FileUploadResult[]> {
    const uploadPromises = Array.from(files).map(file => 
      this.uploadFile(file, memberId).toPromise()
    );

    return from(Promise.all(uploadPromises)) as Observable<FileUploadResult[]>;
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): FileValidationResult {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
      };
    }

    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: PDF, JPEG, PNG`
      };
    }

    return { valid: true };
  }

  /**
   * Get allowed file types for file input
   */
  getAllowedFileTypes(): string {
    return '.pdf,.jpg,.jpeg,.png';
  }

  /**
   * Simulate file upload to local storage
   * In production, this would be replaced with actual HTTP upload to backend
   */
  private async simulateFileUpload(file: File, memberId: string): Promise<FileUploadResult> {
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = this.sanitizeFileName(file.name);
    const fileName = `${timestamp}_${sanitizedFileName}`;
    
    // Construct file path (this would be the actual path on server)
    const fileUrl = `/uploads/members/${memberId}/documents/${fileName}`;

    // In a real implementation, you would:
    // 1. Convert file to FormData
    // 2. POST to backend endpoint
    // 3. Backend saves to local folder or uploads to cloud storage
    // 4. Return the URL from backend response

    // Simulate async operation
    await this.delay(500);

    return {
      fileUrl,
      fileName: sanitizedFileName,
      fileSize: file.size,
      mimeType: file.type
    };
  }

  /**
   * Sanitize filename to remove special characters
   */
  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
  }

  /**
   * Utility function to simulate delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Future method for cloud storage upload (AWS S3, Azure, etc.)
   * Uncomment and implement when migrating to cloud storage
   */
  /*
  private async uploadToCloudStorage(file: File, memberId: string): Promise<FileUploadResult> {
    // Implementation for AWS S3, Azure Blob Storage, etc.
    // const formData = new FormData();
    // formData.append('file', file);
    // formData.append('memberId', memberId);
    // 
    // return this.http.post<FileUploadResult>('/api/files/upload', formData).toPromise();
  }
  */

  /**
   * Delete file from storage
   * Currently a no-op for local simulation, implement for production
   */
  deleteFile(fileUrl: string): Observable<void> {
    // In production, this would call backend to delete the file
    return from(Promise.resolve());
  }
}
