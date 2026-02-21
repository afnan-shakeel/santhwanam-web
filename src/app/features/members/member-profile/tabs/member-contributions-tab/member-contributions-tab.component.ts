import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { ContributionsService } from '../../../../../core/services/contributions.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { MemberContribution } from '../../../../../shared/models/death-claim.model';
import { MemberContributionWithRelations } from '../../../../../shared/models/contribution.model';
import { AccessService } from '../../../../../core/services/access.service';
import { ButtonComponent } from "../../../../../shared/components/button/button.component";
import { RecordCashModalV2Component } from '../../../../death-claims-v2/components/record-cash-modal/record-cash-modal.component';


@Component({
  selector: 'app-member-contributions-tab',
  standalone: true,
  imports: [CommonModule, RecordCashModalV2Component, ButtonComponent],
  templateUrl: './member-contributions-tab.component.html',
  styleUrls: ['./member-contributions-tab.component.css']
})
export class MemberContributionsTabComponent implements OnInit {
  private contributionsService = inject(ContributionsService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private accessService = inject(AccessService);
  // State
  contributions = signal<MemberContribution[] | MemberContributionWithRelations[]>([]);
  loading = signal(true);
  viewMode = this.accessService.viewMode
  selectedStatus = signal<string>('all');

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);

  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));

  // Summary stats
  totalPaid = computed(() => {
    return this.contributions()
      .filter(c => this.getStatus(c) === 'Collected' || this.getStatus(c) === 'Acknowledged')
      .reduce((sum, c) => sum + this.getAmount(c), 0);
  });

  totalPending = computed(() => {
    return this.contributions()
      .filter(c => this.getStatus(c) === 'Pending' || this.getStatus(c) === 'WalletDebitRequested')
      .reduce((sum, c) => sum + this.getAmount(c), 0);
  });

    showRecordCashModal = signal(false);
  selectedContribution = signal<MemberContribution | MemberContributionWithRelations | null>(null);


  ngOnInit(): void {
    this.loadContributions();
  }


  private loadContributions(): void {
    this.loading.set(true);
    
    if (this.viewMode() === 'member') {
      this.contributionsService.getMyContributionsHistory({
        status: this.selectedStatus() !== 'all' ? this.selectedStatus() as any : undefined,
        page: this.currentPage(),
        limit: this.pageSize()
      }).subscribe({
        next: (response) => {
          this.contributions.set(response.contributions || []);
          this.totalItems.set(response.total || 0);
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          this.toastService.error('Failed to load contributions', error?.error?.message || 'Please try again');
        }
      });
    } else {
      const memberId = this.route.parent?.snapshot.paramMap.get('memberId');
      if (memberId) {
        this.contributionsService.getMemberContributionHistory(memberId, {
          status: this.selectedStatus() !== 'all' ? this.selectedStatus() : undefined,
          page: this.currentPage(),
          limit: this.pageSize()
        }).subscribe({
          next: (response) => {
            this.contributions.set(response?.contributions || []);
            this.totalItems.set(response?.total || 0);
            this.loading.set(false);
          },
          error: (error) => {
            this.loading.set(false);
            this.toastService.error('Failed to load contributions', error?.error?.message || 'Please try again');
          }
        });
      }
    }
  }

  onFilterChange(status: string): void {
    this.selectedStatus.set(status);
    this.currentPage.set(1);
    this.loadContributions();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadContributions();
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Collected':
      case 'Acknowledged':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Pending':
      case 'WalletDebitRequested':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Missed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'Exempted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    }
  }

  // Helper methods to handle different model types
  getStatus(contribution: MemberContribution | MemberContributionWithRelations): string {
    return (contribution as MemberContributionWithRelations).contributionStatus || 
           (contribution as MemberContribution).contributionStatus || 
           'Unknown';
  }

  getAmount(contribution: MemberContribution | MemberContributionWithRelations): number {
    return contribution.expectedAmount || 0;
  }

  getContributionId(contribution: MemberContribution | MemberContributionWithRelations): string {
    return contribution.contributionId;
  }

  getCollectionDate(contribution: MemberContribution | MemberContributionWithRelations): string | null {
    const c = contribution as MemberContributionWithRelations;
    return c.collectionDate || (contribution as MemberContribution).collectionDate || null;
  }

  getPaymentMethod(contribution: MemberContribution | MemberContributionWithRelations): string | null {
    return contribution.paymentMethod || null;
  }

  getCycleInfo(contribution: MemberContribution | MemberContributionWithRelations): { cycleNumber?: string; deceasedMemberName?: string } {
    const c = contribution as MemberContributionWithRelations;
    return c.cycle ? { 
      cycleNumber: c.cycle.cycleNumber, 
      deceasedMemberName: c.cycle.deceasedMemberName 
    } : {};
  }

    openRecordCashModal(contribution: MemberContribution | MemberContributionWithRelations): void {
      this.selectedContribution.set(contribution);
      this.showRecordCashModal.set(true);
    }
  
    closeRecordCashModal(): void {
      this.showRecordCashModal.set(false);
      this.selectedContribution.set(null);
    }
  
    onCashRecorded(): void {
      this.closeRecordCashModal();
      this.loadContributions();
    }
}
