import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-agent-activity-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agent-activity-tab.component.html',
  styleUrl: './agent-activity-tab.component.css'
})
export class AgentActivityTabComponent implements OnInit {
  private route = inject(ActivatedRoute);

  agentId = signal<string>('');
  loading = signal(false);

  ngOnInit(): void {
    const agentId = this.route.parent?.snapshot.params['agentId'];
    if (agentId) {
      this.agentId.set(agentId);
      // TODO: Load activity log
    }
  }
}
