import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgentProfile } from '../../../../../shared/models/agent-profile.model';
import { AgentViewMode } from '../agent-info-card/agent-info-card.component';

@Component({
  selector: 'app-agent-hierarchy-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agent-hierarchy-card.component.html',
  styleUrls: ['./agent-hierarchy-card.component.css']
})
export class AgentHierarchyCardComponent {
  // Inputs
  agent = input<AgentProfile | null>(null);
  viewMode = input<AgentViewMode>('self');
  showChangeUnit = input<boolean>(true);
  loading = input<boolean>(false);

  // Outputs
  changeUnit = output<void>();

  // Computed
  title = computed(() => {
    return this.viewMode() === 'self' ? 'My Hierarchy' : 'Hierarchy & Assignment';
  });

  hasHierarchy = computed(() => {
    const a = this.agent();
    return !!(a?.unit || a?.area || a?.forum);
  });

  onChangeUnit(): void {
    this.changeUnit.emit();
  }
}
