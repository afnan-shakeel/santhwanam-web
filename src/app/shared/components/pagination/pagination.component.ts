import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css']
})
export class PaginationComponent {
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalItems = 0;
  @Input() pageSize = 10;
  
  @Output() pageChange = new EventEmitter<number>();

  get pages(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisible = 7;
    
    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 3; i++) pages.push(i);
        pages.push('...');
        pages.push(this.totalPages - 1, this.totalPages);
      } else if (this.currentPage >= this.totalPages - 2) {
        pages.push(1, 2, '...');
        for (let i = this.totalPages - 2; i <= this.totalPages; i++) pages.push(i);
      } else {
        pages.push(1, '...');
        pages.push(this.currentPage - 1, this.currentPage, this.currentPage + 1);
        pages.push('...', this.totalPages);
      }
    }
    
    return pages;
  }

  onPageClick(page: number | string): void {
    if (typeof page === 'number' && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  onPrevious(): void {
    if (this.currentPage > 1) {
      this.pageChange.emit(this.currentPage - 1);
    }
  }

  onNext(): void {
    if (this.currentPage < this.totalPages) {
      this.pageChange.emit(this.currentPage + 1);
    }
  }

  get showingFrom(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingTo(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }
}
