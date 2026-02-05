import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal
} from '@angular/core';

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  badge?: number;
  disabled?: boolean;
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabsComponent {
  // ═══════════════════════════════════════════════════════════════════════════
  // INPUTS
  // ═══════════════════════════════════════════════════════════════════════════

  /** List of tabs to display */
  readonly tabs = input.required<TabItem[]>();

  /** Currently active tab ID */
  readonly activeTab = input<string>();

  // ═══════════════════════════════════════════════════════════════════════════
  // OUTPUTS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Emits when a tab is selected */
  readonly tabChange = output<string>();

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════

  private internalActiveTab = signal<string | null>(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  isActive(tabId: string): boolean {
    const activeFromInput = this.activeTab();
    if (activeFromInput) {
      return activeFromInput === tabId;
    }
    // Fall back to first tab if no active tab specified
    const tabs = this.tabs();
    return tabs.length > 0 && tabs[0].id === tabId;
  }

  selectTab(tab: TabItem): void {
    if (tab.disabled) return;
    this.internalActiveTab.set(tab.id);
    this.tabChange.emit(tab.id);
  }

  getTabClasses(tab: TabItem): string {
    const baseClasses = 'relative px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500';

    if (tab.disabled) {
      return `${baseClasses} text-slate-400 cursor-not-allowed`;
    }

    if (this.isActive(tab.id)) {
      return `${baseClasses} text-primary-600 border-b-2 border-primary-600`;
    }

    return `${baseClasses} text-slate-600 hover:text-slate-900 hover:bg-slate-50`;
  }
}
