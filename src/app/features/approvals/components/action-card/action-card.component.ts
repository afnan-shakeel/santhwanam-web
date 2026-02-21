import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-action-card',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './action-card.component.html',
  styleUrls: ['./action-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActionCardComponent {
  @Input() executionId = '';
  @Input() processing = false;

  @Output() approve = new EventEmitter<{ executionId: string; comments: string }>();
  @Output() reject = new EventEmitter<{ executionId: string; comments: string }>();

  comments = signal('');

  onApprove(): void {
    this.approve.emit({ executionId: this.executionId, comments: this.comments() });
  }

  onReject(): void {
    this.reject.emit({ executionId: this.executionId, comments: this.comments() });
  }

  updateComments(event: Event): void {
    this.comments.set((event.target as HTMLTextAreaElement).value);
  }
}
