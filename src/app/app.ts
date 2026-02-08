import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import '@tailwindplus/elements';

import { ConfirmationModalComponent } from './shared/components/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConfirmationModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
