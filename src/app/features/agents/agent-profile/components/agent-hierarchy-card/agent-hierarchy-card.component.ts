import { Component, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgentProfile } from '../../../../../shared/models/agent-profile.model';
import { AccessService } from '../../../../../core/services/access.service';

@Component({
  selector: 'app-agent-hierarchy-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agent-hierarchy-card.component.html',
  styleUrls: ['./agent-hierarchy-card.component.css']
})
export class AgentHierarchyCardComponent {
  private accessService = inject(AccessService)
  readonly viewMode = this.accessService.viewMode
  // Inputs
  agent = input<AgentProfile | null>(null);
  showChangeUnit = input<boolean>(true);
  loading = input<boolean>(false);

  // Outputs
  changeUnit = output<void>();

  // Computed
  title = computed(() => {
    return this.viewMode() === 'agent' ? 'My Hierarchy' : 'Hierarchy & Assignment';
  });

  hasHierarchy = computed(() => {
    const a = this.agent();
    return !!(a?.unit || a?.area || a?.forum);
  });

  onChangeUnit(): void {
    this.changeUnit.emit();
  }
}
