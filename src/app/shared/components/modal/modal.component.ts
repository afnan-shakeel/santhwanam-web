import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnChanges, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
})
export class ModalComponent implements AfterViewInit, OnChanges {
  @Input() id!: string;
  @Input() title?: string;
  @Input() size: ModalSize = 'md';
  @Input() showCloseButton = true;
  @Input() persist = false;
  @Input() open = false;

  @Output() openChange = new EventEmitter<boolean>();
  @Output() opened = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  @ViewChild('dialogElement', { static: false }) dialogElement!: ElementRef<any>;

  ngAfterViewInit(): void {
    if (this.dialogElement?.nativeElement) {
      const dialog = this.dialogElement.nativeElement;

      // Listen to open event
      dialog.addEventListener('open', () => {
        this.openChange.emit(true);
        this.opened.emit();
      });

      // Listen to close event
      dialog.addEventListener('close', () => {
        this.openChange.emit(false);
        this.closed.emit();
      });

      // Handle cancel event (Escape key or backdrop click)
      if (this.persist) {
        dialog.addEventListener('cancel', (event: Event) => {
          event.preventDefault();
        });
      }

      // Open dialog if open input is true
      if (this.open) {
        this.show();
      }
    }
  }

  ngOnChanges(): void {
    if (this.dialogElement?.nativeElement) {
      if (this.open) {
        this.show();
      } else {
        this.hide();
      }
    }
  }

  show(): void {
    if (this.dialogElement?.nativeElement) {
      this.dialogElement.nativeElement.show();
    }
  }

  hide(): void {
    if (this.dialogElement?.nativeElement) {
      this.dialogElement.nativeElement.hide();
    }
  }

  get sizeClasses(): string {
    const sizeMap: Record<ModalSize, string> = {
      sm: 'sm:max-w-sm',
      md: 'sm:max-w-lg',
      lg: 'sm:max-w-2xl',
      xl: 'sm:max-w-4xl'
    };
    return sizeMap[this.size] || sizeMap.md;
  }
}
