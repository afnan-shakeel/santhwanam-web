import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StepConfig {
  title: string;
  description: string;
  status: 'complete' | 'current' | 'upcoming';
}

@Component({
  selector: 'app-progress-stepper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-stepper.component.html',
  styleUrl: './progress-stepper.component.css'
})
export class ProgressStepperComponent {
  @Input() steps: StepConfig[] = [];
}
