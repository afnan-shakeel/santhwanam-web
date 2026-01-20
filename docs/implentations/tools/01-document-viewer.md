# Document Viewer Component - UI Implementation Spec

**Version:** 2.0  
**Last Updated:** January 2025  
**Status:** Ready for Implementation

---

## Overview

A lightweight, reusable modal component for viewing uploaded documents (PDFs and images) across the application. Primary use cases include verifying member identity documents during registration and reviewing death claim supporting documents.

### Supported File Types

| MIME Type | Extension | Rendering Method |
|-----------|-----------|------------------|
| `application/pdf` | .pdf | Browser native via `<iframe>` |
| `image/jpeg` | .jpg, .jpeg | Native `<img>` tag |
| `image/png` | .png | Native `<img>` tag |

### Design Goals

- Zero external dependencies (uses browser native capabilities)
- Consistent with existing modal patterns
- **Flexible URL source** - works with both blob URLs (streams) and direct cloud URLs
- Simple API for easy integration
- Responsive design (mobile-friendly)
- Basic zoom for images
- Download capability

---

## URL Strategy: Supporting Both Blob URLs and Cloud URLs

The component is designed to be **URL-source agnostic**. It accepts any valid URL and renders it.

### How It Works

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DocumentViewerComponent                       │
│                                                                     │
│   Input: url (string)  ←─────┬────────────────────────────────────  │
│                              │                                      │
│   Component doesn't care     │                                      │
│   about URL source!          │                                      │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                 │
              ▼                                 ▼
    ┌─────────────────────┐          ┌─────────────────────┐
    │   Blob URL          │          │   Cloud URL         │
    │   (from stream)     │          │   (direct link)     │
    │                     │          │                     │
    │ blob:http://...     │          │ https://storage...  │
    │                     │          │                     │
    │ Created via:        │          │ Stored in DB as:    │
    │ URL.createObjectURL │          │ document.fileUrl    │
    └─────────────────────┘          └─────────────────────┘
              │                                 │
              │    DocumentService              │
              │    abstracts the difference     │
              │                                 │
              └────────────────┬────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  getDocumentForView │
                    │  returns: { url }   │
                    └─────────────────────┘
```

### Current Phase (Blob URLs from Streams)

```typescript
// Service fetches stream → converts to blob URL
const blob = await fetch('/api/.../download').then(r => r.blob());
const url = URL.createObjectURL(blob);
```

### Future Phase (Direct Cloud URLs)

```typescript
// Service returns cloud URL directly (no fetch needed)
const url = document.fileUrl; // "https://storage.supabase.co/..."
```

### Transition Path

When you migrate to cloud URLs:
1. **Component:** No changes needed ✅
2. **Service:** Update `getDocumentForView()` to return `fileUrl` directly instead of fetching blob
3. **Cleanup logic:** Can be removed (cloud URLs don't need revocation)

---

## Component Location

```
src/app/shared/
├── components/
│   └── document-viewer/
│       ├── document-viewer.component.ts
│       ├── document-viewer.component.html
│       └── document-viewer.component.css
│
└── services/
    └── document.service.ts
```

---

## Component API

### Inputs

| Input | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `open` | `model<boolean>` | Yes | `false` | Two-way binding for modal visibility |
| `document` | `input<DocumentViewerData \| null>` | Yes | `null` | Document data to display |

### DocumentViewerData Interface

```typescript
/**
 * Data structure for document viewer.
 * Works with both blob URLs (from streams) and direct cloud URLs.
 */
export interface DocumentViewerData {
  /** Display name shown in modal header */
  documentName: string;
  
  /** 
   * URL to the document - can be:
   * - Blob URL: "blob:http://localhost:4200/abc-123..."
   * - Cloud URL: "https://storage.supabase.co/bucket/file.pdf"
   * - Signed URL: "https://storage.supabase.co/bucket/file.pdf?token=xyz"
   */
  url: string;
  
  /** MIME type for rendering decision */
  mimeType: 'application/pdf' | 'image/jpeg' | 'image/png';
  
  /** 
   * Whether this is a blob URL that needs cleanup.
   * Set to true when using blob URLs from streams.
   * Set to false or omit when using direct cloud URLs.
   */
  requiresCleanup?: boolean;
  
  /** Optional: File size for display */
  fileSize?: number;
  
  /** Optional: Upload date for display */
  uploadedAt?: Date | string;
  
  /** Optional: Verification status badge */
  verificationStatus?: 'Pending' | 'Verified' | 'Rejected';
}
```

### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `closed` | `EventEmitter<void>` | Emitted when modal is closed |

---

## Document Service

The service abstracts URL generation and handles the difference between blob URLs and cloud URLs.

### Implementation

```typescript
// src/app/shared/services/document.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map } from 'rxjs';

/**
 * Document metadata from API responses
 */
export interface DocumentMetadata {
  documentId: string;
  documentName: string;
  mimeType: string;
  fileSize?: number;
  uploadedAt?: string;
  verificationStatus?: 'Pending' | 'Verified' | 'Rejected';
  fileUrl?: string; // Present when using cloud storage URLs
}

/**
 * Data structure for viewing documents
 */
export interface DocumentViewData {
  documentName: string;
  url: string;
  mimeType: string;
  requiresCleanup: boolean;
  fileSize?: number;
  uploadedAt?: string;
  verificationStatus?: 'Pending' | 'Verified' | 'Rejected';
}

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private http = inject(HttpClient);
  
  // Track active blob URLs for cleanup
  private activeBlobUrls = new Set<string>();

  // ─────────────────────────────────────────────────────────────
  // Configuration - Toggle between blob and cloud URL modes
  // ─────────────────────────────────────────────────────────────
  
  /**
   * Set to true when fileUrl is available in document metadata.
   * Set to false to use stream download → blob URL approach.
   */
  private readonly useCloudUrls = false; // TODO: Set to true when cloud URLs are implemented

  // ─────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────

  /**
   * Get document ready for viewing.
   * Automatically handles blob URL vs cloud URL based on configuration.
   */
  getMemberDocumentForView(
    memberId: string,
    documentId: string,
    metadata: DocumentMetadata
  ): Observable<DocumentViewData> {
    
    // If cloud URLs are enabled and available, use directly
    if (this.useCloudUrls && metadata.fileUrl) {
      return of(this.createViewDataFromCloudUrl(metadata));
    }
    
    // Otherwise, fetch stream and create blob URL
    return this.fetchAsBlobUrl(
      `/api/members/${memberId}/documents/${documentId}/download`,
      metadata
    );
  }

  /**
   * Get death claim document ready for viewing.
   */
  getClaimDocumentForView(
    claimId: string,
    documentId: string,
    metadata: DocumentMetadata
  ): Observable<DocumentViewData> {
    
    if (this.useCloudUrls && metadata.fileUrl) {
      return of(this.createViewDataFromCloudUrl(metadata));
    }
    
    return this.fetchAsBlobUrl(
      `/api/death-claims/${claimId}/documents/${documentId}/download`,
      metadata
    );
  }

  /**
   * Cleanup a blob URL when viewer closes.
   * Safe to call with cloud URLs - will be ignored.
   */
  cleanupUrl(url: string): void {
    if (this.activeBlobUrls.has(url)) {
      URL.revokeObjectURL(url);
      this.activeBlobUrls.delete(url);
      console.debug('[DocumentService] Revoked blob URL');
    }
    // Cloud URLs are ignored - no cleanup needed
  }

  /**
   * Cleanup all active blob URLs.
   * Call on logout or when navigating away.
   */
  cleanupAllUrls(): void {
    this.activeBlobUrls.forEach(url => URL.revokeObjectURL(url));
    this.activeBlobUrls.clear();
    console.debug('[DocumentService] Revoked all blob URLs');
  }

  // ─────────────────────────────────────────────────────────────
  // Private Helpers
  // ─────────────────────────────────────────────────────────────

  /**
   * Fetch file as stream and convert to blob URL
   */
  private fetchAsBlobUrl(
    downloadUrl: string,
    metadata: DocumentMetadata
  ): Observable<DocumentViewData> {
    return this.http.get(downloadUrl, { responseType: 'blob' }).pipe(
      map(blob => {
        const blobUrl = URL.createObjectURL(blob);
        this.activeBlobUrls.add(blobUrl);
        
        return {
          documentName: metadata.documentName,
          url: blobUrl,
          mimeType: metadata.mimeType,
          requiresCleanup: true, // Blob URLs need cleanup
          fileSize: metadata.fileSize,
          uploadedAt: metadata.uploadedAt,
          verificationStatus: metadata.verificationStatus,
        };
      })
    );
  }

  /**
   * Create view data from cloud URL (no fetch needed)
   */
  private createViewDataFromCloudUrl(metadata: DocumentMetadata): DocumentViewData {
    return {
      documentName: metadata.documentName,
      url: metadata.fileUrl!,
      mimeType: metadata.mimeType,
      requiresCleanup: false, // Cloud URLs don't need cleanup
      fileSize: metadata.fileSize,
      uploadedAt: metadata.uploadedAt,
      verificationStatus: metadata.verificationStatus,
    };
  }
}
```

---

## Component Implementation

### TypeScript (document-viewer.component.ts)

```typescript
import {
  Component,
  computed,
  input,
  model,
  output,
  signal,
  inject,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ModalComponent } from '../modal/modal.component';
import { DocumentService } from '../../services/document.service';

export interface DocumentViewerData {
  documentName: string;
  url: string;
  mimeType: 'application/pdf' | 'image/jpeg' | 'image/png';
  requiresCleanup?: boolean;
  fileSize?: number;
  uploadedAt?: Date | string;
  verificationStatus?: 'Pending' | 'Verified' | 'Rejected';
}

@Component({
  selector: 'app-document-viewer',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './document-viewer.component.html',
  styleUrl: './document-viewer.component.css',
})
export class DocumentViewerComponent implements OnDestroy {
  private sanitizer = inject(DomSanitizer);
  private documentService = inject(DocumentService);

  // ─────────────────────────────────────────────────────────────
  // Inputs & Outputs
  // ─────────────────────────────────────────────────────────────
  
  open = model<boolean>(false);
  document = input<DocumentViewerData | null>(null);
  
  closed = output<void>();

  // ─────────────────────────────────────────────────────────────
  // Internal State
  // ─────────────────────────────────────────────────────────────
  
  /** Image zoom state (only for images) */
  zoomed = signal<boolean>(false);
  
  /** Loading state for content */
  loading = signal<boolean>(true);
  
  /** Error state if content fails to load */
  error = signal<string | null>(null);
  
  /** Track current URL for cleanup */
  private currentUrl: string | null = null;

  // ─────────────────────────────────────────────────────────────
  // Computed Values
  // ─────────────────────────────────────────────────────────────
  
  /** Check if document is an image */
  isImage = computed(() => {
    const doc = this.document();
    return doc?.mimeType?.startsWith('image/') ?? false;
  });

  /** Check if document is a PDF */
  isPdf = computed(() => {
    const doc = this.document();
    return doc?.mimeType === 'application/pdf';
  });

  /** Modal title - document name or fallback */
  modalTitle = computed(() => {
    return this.document()?.documentName ?? 'Document Viewer';
  });

  /** Safe URL for iframe/img */
  safeUrl = computed((): SafeResourceUrl | null => {
    const doc = this.document();
    if (!doc?.url) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(doc.url);
  });

  /** Raw URL for download/new tab */
  rawUrl = computed(() => this.document()?.url ?? null);

  /** Formatted file size */
  formattedFileSize = computed(() => {
    const size = this.document()?.fileSize;
    if (!size) return null;
    
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  });

  /** Formatted upload date */
  formattedUploadDate = computed(() => {
    const date = this.document()?.uploadedAt;
    if (!date) return null;
    
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  });

  /** Verification status badge config */
  statusBadge = computed(() => {
    const status = this.document()?.verificationStatus;
    if (!status) return null;
    
    const config: Record<string, { label: string; class: string }> = {
      Pending: { label: 'Pending', class: 'bg-yellow-100 text-yellow-800' },
      Verified: { label: 'Verified', class: 'bg-green-100 text-green-800' },
      Rejected: { label: 'Rejected', class: 'bg-red-100 text-red-800' },
    };
    
    return config[status] ?? null;
  });

  // ─────────────────────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────────────────────

  ngOnDestroy(): void {
    this.cleanupCurrentUrl();
  }

  // ─────────────────────────────────────────────────────────────
  // Methods
  // ─────────────────────────────────────────────────────────────
  
  /** Toggle zoom state for images */
  toggleZoom(): void {
    if (this.isImage()) {
      this.zoomed.update(z => !z);
    }
  }

  /** Handle modal open/close */
  onOpenChange(isOpen: boolean): void {
    this.open.set(isOpen);
    
    if (isOpen) {
      // Reset state when opening
      this.zoomed.set(false);
      this.loading.set(true);
      this.error.set(null);
      this.currentUrl = this.document()?.url ?? null;
    } else {
      // Cleanup and emit closed event
      this.cleanupCurrentUrl();
      this.closed.emit();
    }
  }

  /** Handle content load complete */
  onContentLoaded(): void {
    this.loading.set(false);
  }

  /** Handle content load error */
  onContentError(): void {
    this.loading.set(false);
    this.error.set('Failed to load document. Please try again.');
  }

  /** Retry loading after error */
  retryLoad(): void {
    this.loading.set(true);
    this.error.set(null);
    // Force re-render by toggling a state
    // The browser will retry loading the URL
  }

  /** Download document */
  downloadDocument(): void {
    const doc = this.document();
    if (!doc?.url) return;
    
    const link = document.createElement('a');
    link.href = doc.url;
    link.download = doc.documentName || 'document';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /** Open in new tab */
  openInNewTab(): void {
    const doc = this.document();
    if (!doc?.url) return;
    window.open(doc.url, '_blank');
  }

  /** Cleanup blob URL if needed */
  private cleanupCurrentUrl(): void {
    const doc = this.document();
    if (this.currentUrl && doc?.requiresCleanup) {
      this.documentService.cleanupUrl(this.currentUrl);
    }
    this.currentUrl = null;
  }
}
```

### Template (document-viewer.component.html)

```html
<app-modal
  [open]="open()"
  (openChange)="onOpenChange($event)"
  [title]="modalTitle()"
  size="xl"
  [showFooter]="false">
  
  <!-- Document Metadata Bar -->
  @if (document(); as doc) {
    <div class="flex flex-wrap items-center gap-4 pb-3 mb-3 border-b border-gray-200 text-sm text-gray-600">
      <!-- File Size -->
      @if (formattedFileSize(); as size) {
        <span class="flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {{ size }}
        </span>
      }
      
      <!-- Upload Date -->
      @if (formattedUploadDate(); as date) {
        <span class="flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {{ date }}
        </span>
      }
      
      <!-- Verification Status Badge -->
      @if (statusBadge(); as badge) {
        <span [class]="'px-2 py-0.5 rounded-full text-xs font-medium ' + badge.class">
          {{ badge.label }}
        </span>
      }
      
      <!-- Spacer -->
      <div class="flex-1"></div>
      
      <!-- Zoom Toggle (images only) -->
      @if (isImage()) {
        <button 
          type="button"
          (click)="toggleZoom()"
          class="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          [attr.aria-label]="zoomed() ? 'Zoom out' : 'Zoom in'"
          [title]="zoomed() ? 'Zoom Out' : 'Zoom In'">
          @if (zoomed()) {
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          } @else {
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          }
        </button>
      }
      
      <!-- Open in New Tab -->
      <button 
        type="button"
        (click)="openInNewTab()"
        class="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        aria-label="Open in new tab"
        title="Open in New Tab">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </button>
    </div>
  }
  
  <!-- Content Area -->
  <div class="relative min-h-[60vh] bg-gray-50 rounded-lg overflow-hidden">
    
    <!-- Loading Spinner -->
    @if (loading()) {
      <div class="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
        <div class="flex flex-col items-center gap-3">
          <svg class="w-8 h-8 text-primary-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
          <span class="text-sm text-gray-500">Loading document...</span>
        </div>
      </div>
    }
    
    <!-- Error State -->
    @if (error(); as errorMsg) {
      <div class="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
        <div class="flex flex-col items-center gap-3 text-center px-4">
          <svg class="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p class="text-gray-600">{{ errorMsg }}</p>
          <button 
            type="button"
            (click)="retryLoad()"
            class="btn btn-outline btn-sm">
            Try Again
          </button>
        </div>
      </div>
    }
    
    <!-- PDF Viewer -->
    @if (isPdf() && safeUrl(); as url) {
      <iframe
        [src]="url"
        class="w-full h-[70vh] border-0"
        [title]="'PDF: ' + modalTitle()"
        (load)="onContentLoaded()"
        (error)="onContentError()">
      </iframe>
    }
    
    <!-- Image Viewer -->
    @if (isImage() && rawUrl(); as url) {
      <div 
        class="overflow-auto max-h-[70vh] flex items-center justify-center p-4"
        [class.cursor-zoom-in]="!zoomed()"
        [class.cursor-zoom-out]="zoomed()">
        <img
          [src]="url"
          [alt]="document()?.documentName || 'Document'"
          (load)="onContentLoaded()"
          (error)="onContentError()"
          (click)="toggleZoom()"
          class="max-w-full transition-transform duration-200 origin-center"
          [class.scale-100]="!zoomed()"
          [class.scale-150]="zoomed()"
          [class.shadow-lg]="!zoomed()"
          [class.shadow-2xl]="zoomed()" />
      </div>
    }
    
    <!-- Unsupported Type -->
    @if (!isPdf() && !isImage() && document()) {
      <div class="absolute inset-0 flex items-center justify-center bg-gray-50">
        <div class="flex flex-col items-center gap-3 text-center px-4">
          <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-gray-600">This file type cannot be previewed.</p>
          <button 
            type="button"
            (click)="downloadDocument()"
            class="btn btn-primary btn-sm">
            Download File
          </button>
        </div>
      </div>
    }
  </div>
  
  <!-- Footer Actions -->
  <div class="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
    <button 
      type="button"
      (click)="downloadDocument()"
      class="btn btn-outline">
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Download
    </button>
    <button 
      type="button"
      (click)="onOpenChange(false)"
      class="btn btn-secondary">
      Close
    </button>
  </div>
</app-modal>
```

### Styles (document-viewer.component.css)

```css
/* Zoom transition for smooth scaling */
:host ::ng-deep img {
  transition: transform 0.2s ease-in-out;
}

/* Custom scrollbar for zoomed images */
:host ::ng-deep .overflow-auto::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

:host ::ng-deep .overflow-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

:host ::ng-deep .overflow-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

:host ::ng-deep .overflow-auto::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* PDF iframe removes white flash */
:host ::ng-deep iframe {
  background: #525659;
}
```

---

## Usage Examples

### Basic Usage (Current - Blob URLs)

```typescript
// documents-tab.component.ts

import { Component, inject, signal, input, OnDestroy } from '@angular/core';
import { DocumentService } from '@shared/services/document.service';
import { DocumentViewerComponent, DocumentViewerData } from '@shared/components/document-viewer';

@Component({
  selector: 'app-documents-tab',
  standalone: true,
  imports: [DocumentViewerComponent],
  template: `
    <!-- Document List -->
    @for (doc of documents(); track doc.documentId) {
      <div class="flex items-center justify-between p-4 border rounded-lg">
        <span>{{ doc.documentName }}</span>
        <button 
          (click)="viewDocument(doc)" 
          [disabled]="loadingDocId() === doc.documentId"
          class="btn btn-sm btn-outline">
          {{ loadingDocId() === doc.documentId ? 'Loading...' : 'View' }}
        </button>
      </div>
    }
    
    <!-- Document Viewer -->
    <app-document-viewer
      [(open)]="showViewer"
      [document]="viewerData()"
      (closed)="onViewerClosed()" />
  `
})
export class DocumentsTabComponent implements OnDestroy {
  private documentService = inject(DocumentService);
  
  memberId = input.required<string>();
  documents = input.required<MemberDocument[]>();
  
  showViewer = false;
  viewerData = signal<DocumentViewerData | null>(null);
  loadingDocId = signal<string | null>(null);

  viewDocument(doc: MemberDocument): void {
    this.loadingDocId.set(doc.documentId);
    
    this.documentService.getMemberDocumentForView(
      this.memberId(),
      doc.documentId,
      {
        documentId: doc.documentId,
        documentName: doc.documentName,
        mimeType: doc.mimeType,
        fileSize: doc.fileSize,
        uploadedAt: doc.uploadedAt,
        verificationStatus: doc.verificationStatus,
        fileUrl: doc.fileUrl, // Will be used when cloud URLs are enabled
      }
    ).subscribe({
      next: (data) => {
        this.viewerData.set({
          documentName: data.documentName,
          url: data.url,
          mimeType: data.mimeType as DocumentViewerData['mimeType'],
          requiresCleanup: data.requiresCleanup,
          fileSize: data.fileSize,
          uploadedAt: data.uploadedAt,
          verificationStatus: data.verificationStatus,
        });
        this.showViewer = true;
        this.loadingDocId.set(null);
      },
      error: (err) => {
        console.error('Failed to load document', err);
        this.loadingDocId.set(null);
        // Show toast error
      }
    });
  }

  onViewerClosed(): void {
    // Service handles cleanup internally based on requiresCleanup flag
    this.viewerData.set(null);
  }

  ngOnDestroy(): void {
    // Cleanup any remaining URLs
    this.documentService.cleanupAllUrls();
  }
}
```

### Future Usage (Cloud URLs)

When you switch to cloud URLs, the **only change needed** is in `DocumentService`:

```typescript
// document.service.ts - Just flip this flag!
private readonly useCloudUrls = true; // Changed from false
```

The component and all consumers remain **unchanged**.

---

## Migration Guide: Blob URLs → Cloud URLs

### Step 1: Ensure `fileUrl` is returned in API responses

```typescript
// Current API response
{
  "documentId": "uuid",
  "documentName": "ID Card",
  "mimeType": "image/jpeg",
  "fileSize": 1234567
}

// Updated API response (add fileUrl)
{
  "documentId": "uuid",
  "documentName": "ID Card", 
  "mimeType": "image/jpeg",
  "fileSize": 1234567,
  "fileUrl": "https://storage.supabase.co/bucket/members/123/id-card.jpg"
}
```

### Step 2: Update service configuration

```typescript
// document.service.ts
private readonly useCloudUrls = true; // Flip this flag
```

### Step 3: (Optional) Remove blob cleanup code

Once fully migrated, you can simplify by removing:
- `activeBlobUrls` tracking
- `cleanupUrl()` / `cleanupAllUrls()` methods
- `requiresCleanup` flag

But keeping them doesn't hurt - they're no-ops with cloud URLs.

---

## Wireframes

### Default State (Image)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ID Card Front                                                   ✕   │
├─────────────────────────────────────────────────────────────────────┤
│  📄 1.2 MB   📅 Jan 10, 2025   [Pending]          [🔍+] [↗]         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                                                               │ │
│  │                                                               │ │
│  │                                                               │ │
│  │                    [ ID Card Image ]                          │ │
│  │                  (click to zoom in)                           │ │
│  │                                                               │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                         [⬇ Download]    [Close]     │
└─────────────────────────────────────────────────────────────────────┘
```

### Zoomed State (Image)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ID Card Front                                                   ✕   │
├─────────────────────────────────────────────────────────────────────┤
│  📄 1.2 MB   📅 Jan 10, 2025   [Pending]          [🔍-] [↗]         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┬──┐ │
│  │                                                            │▲ │ │
│  │     ┌──────────────────────────────────┐                   │░ │ │
│  │     │                                  │                   │░ │ │
│  │     │   [ Zoomed 150% - Scrollable ]   │                   │░ │ │
│  │     │     (click to zoom out)          │                   │░ │ │
│  │     │                                  │                   │░ │ │
│  │     └──────────────────────────────────┘                   │▼ │ │
│  └────────────────────────────────────────────────────────────┴──┘ │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                         [⬇ Download]    [Close]     │
└─────────────────────────────────────────────────────────────────────┘
```

### PDF State

```
┌─────────────────────────────────────────────────────────────────────┐
│ Death Certificate.pdf                                           ✕   │
├─────────────────────────────────────────────────────────────────────┤
│  📄 2.5 MB   📅 Jan 15, 2025   [Verified]                     [↗]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ ┌─────────────────────────────────────────────────────────┐   │ │
│  │ │  [Browser PDF Viewer Controls]            1 / 3    🔍 ⬇  │   │ │
│  │ ├─────────────────────────────────────────────────────────┤   │ │
│  │ │                                                         │   │ │
│  │ │                                                         │   │ │
│  │ │              [ PDF Content Rendered ]                   │   │ │
│  │ │                                                         │   │ │
│  │ │                                                         │   │ │
│  │ └─────────────────────────────────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                         [⬇ Download]    [Close]     │
└─────────────────────────────────────────────────────────────────────┘
```

### Loading State (Blob URL Fetch)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Document Name                                                   ✕   │
├─────────────────────────────────────────────────────────────────────┤
│  📄 1.2 MB   📅 Jan 10, 2025                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                                                                     │
│                                                                     │
│                          ⟳ (spinning)                               │
│                       Loading document...                           │
│                                                                     │
│                                                                     │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                         [⬇ Download]    [Close]     │
└─────────────────────────────────────────────────────────────────────┘
```

### Error State

```
┌─────────────────────────────────────────────────────────────────────┐
│ Document Name                                                   ✕   │
├─────────────────────────────────────────────────────────────────────┤
│  📄 1.2 MB   📅 Jan 10, 2025                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                                                                     │
│                            ⚠️                                       │
│                                                                     │
│              Failed to load document. Please try again.             │
│                                                                     │
│                         [Try Again]                                 │
│                                                                     │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                         [⬇ Download]    [Close]     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Mobile Responsive Behavior

### Breakpoints

| Screen | Modal Size | Image Behavior |
|--------|------------|----------------|
| Desktop (≥1024px) | `xl` (max-width: 896px) | Centered, zoom toggle |
| Tablet (768-1023px) | `lg` (max-width: 672px) | Centered, zoom toggle |
| Mobile (<768px) | Full screen | Pinch-to-zoom native |

### Mobile Adjustments

```css
/* Mobile full-screen modal */
@media (max-width: 767px) {
  :host ::ng-deep .modal-content {
    max-width: 100%;
    max-height: 100%;
    margin: 0;
    border-radius: 0;
  }
  
  /* Hide custom zoom on mobile (use native pinch) */
  .zoom-toggle {
    display: none;
  }
  
  /* Larger touch targets */
  .btn {
    min-height: 44px;
    padding: 12px 16px;
  }
}
```

---

## Accessibility

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Escape` | Close modal |
| `Tab` | Navigate between buttons |
| `Enter/Space` | Activate focused button |

### ARIA Attributes

- Modal has `role="dialog"` and `aria-modal="true"`
- Images have descriptive `alt` text
- PDFs have descriptive `title` attribute
- Buttons have `aria-label` for icon-only actions

---

## Integration Points

### 1. Member Profile - Documents Tab

**Location:** `src/app/features/members/member-profile/documents-tab/`

### 2. Death Claim Detail - Documents Section

**Location:** `src/app/features/death-claims/death-claim-detail/`

### 3. Member Registration - Documents Step

**Location:** `src/app/features/member-registration/documents-step/`

---

## Testing Checklist

### Unit Tests

- [ ] Component renders with valid image data
- [ ] Component renders with valid PDF data
- [ ] Zoom toggle works for images
- [ ] Modal opens and closes correctly
- [ ] Download triggers correctly
- [ ] Error state displays on load failure
- [ ] Loading state displays while content loads
- [ ] Cleanup called on close (blob URLs)
- [ ] Cleanup skipped for cloud URLs

### E2E Tests

- [ ] View member document from profile
- [ ] View death claim document
- [ ] Download document works
- [ ] Open in new tab works
- [ ] Mobile responsiveness
- [ ] Keyboard navigation (Escape to close)

### Manual Testing

- [ ] Test with various PDF sizes (1 page, 50 pages)
- [ ] Test with various image sizes
- [ ] Test on slow network (loading state)
- [ ] Test with expired/invalid URLs (error state)
- [ ] Test on mobile devices (iOS Safari, Android Chrome)

---

## Summary

| Aspect | Details |
|--------|---------|
| **Component** | `DocumentViewerComponent` |
| **Location** | `src/app/shared/components/document-viewer/` |
| **Service** | `DocumentService` |
| **Dependencies** | `ModalComponent` (existing) |
| **File Types** | PDF, JPEG, PNG |
| **URL Support** | Both blob URLs and cloud URLs |
| **Features** | View, Zoom (images), Download, Open in new tab |
| **Responsive** | Yes, full-screen on mobile |
| **Accessible** | Yes, keyboard + screen reader support |
| **Est. Effort** | 4-5 hours |

### Key Design Decision

The component uses a **URL-agnostic approach**:
- Input is just `url: string`
- Service handles blob vs cloud URL logic
- `requiresCleanup` flag controls cleanup behavior
- **Zero component changes needed** when migrating to cloud URLs