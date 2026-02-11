import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { CashManagementService } from '../../../../core/services/cash-management.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';
import { ToastService } from '../../../../core/services/toast.service';
import { 
  CashCustody, 
  ValidReceiver,
  InitiateHandoverRequest
} from '../../../../shared/models/cash-management.model';

/**
 * InitiateHandoverComponent
 * 
 * Screen 2: Initiate Handover
 * Route: /cash/handover/new
 * Users: Agent, Unit Admin, Area Admin, Forum Admin
 * Purpose: Create a new cash handover request
 */
@Component({
  selector: 'app-initiate-handover',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, BackButtonComponent],
  templateUrl: './initiate-handover.component.html',
  styleUrl: './initiate-handover.component.css'
})
export class InitiateHandoverComponent implements OnInit {
  private cashService = inject(CashManagementService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // State
  custody = signal<CashCustody | null>(null);
  receivers = signal<ValidReceiver[]>([]);
  
  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);

  // Form fields
  selectedReceiverId = signal<string>('');
  amount = signal<number | null>(null);
  notes = signal<string>('');

  // Computed
  selectedReceiver = computed(() => {
    const id = this.selectedReceiverId();
    return this.receivers().find(r => r.userId === id) || null;
  });

  availableBalance = computed(() => {
    return this.custody()?.currentBalance || 0;
  });

  isFormValid = computed(() => {
    const receiver = this.selectedReceiverId();
    const amt = this.amount();
    const balance = this.availableBalance();

    if (!receiver) return false;
    if (!amt || amt <= 0) return false;
    if (amt > balance) return false;

    return true;
  });

  amountError = computed(() => {
    const amt = this.amount();
    const balance = this.availableBalance();

    if (amt === null) return null;
    if (amt <= 0) return 'Amount must be greater than zero';
    if (amt > balance) return `Amount exceeds available balance (${this.formatCurrency(balance)})`;

    return null;
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    // Load custody balance
    this.cashService.getMyCustody().subscribe({
      next: (response) => {
        if (response) {
          this.custody.set(response.custody);
        }
      },
      error: (err) => {
        console.error('Error loading custody:', err);
        this.toastService.error('Failed to load custody data');
      }
    });

    // Load valid receivers
    this.cashService.getValidReceivers().subscribe({
      next: (response) => {
        if (response) {
          this.receivers.set(response.recipients);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading receivers:', err);
        this.toastService.error('Failed to load receivers');
        this.isLoading.set(false);
      }
    });
  }

  formatCurrency(amount: number): string {
    return this.cashService.formatCurrency(amount);
  }

  onReceiverChange(userId: string): void {
    this.selectedReceiverId.set(userId);
  }

  onAmountChange(value: string): void {
    const numValue = parseFloat(value);
    this.amount.set(isNaN(numValue) ? null : numValue);
  }

  onNotesChange(value: string): void {
    this.notes.set(value);
  }

  setMaxAmount(): void {
    this.amount.set(this.availableBalance());
  }

  onCancel(): void {
    this.navigateBack();
  }

  /**
   * Navigate back using returnUrl from query params, or fallback to /cash/my-custody
   */
  private navigateBack(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//')) {
      try {
        this.router.navigateByUrl(this.router.parseUrl(returnUrl));
        return;
      } catch { /* fall through */ }
    }
    this.router.navigate(['/cash/my-custody']);
  }

  onSubmit(): void {
    if (!this.isFormValid() || this.isSubmitting()) return;

    const receiver = this.selectedReceiver();
    if (!receiver) return;

    this.isSubmitting.set(true);

    const request: InitiateHandoverRequest = {
      toUserId: receiver.userId,
      toUserRole: receiver.role as any,
      amount: this.amount()!,
      initiatorNotes: this.notes() || undefined
    };

    this.cashService.initiateHandover(request).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Handover initiated successfully');
          this.navigateBack();
        }
        this.isSubmitting.set(false);
      },
      error: (err) => {
        console.error('Error initiating handover:', err);
        const message = err.error?.message || 'Failed to initiate handover';
        this.toastService.error(message);
        this.isSubmitting.set(false);
      }
    });
  }
}
