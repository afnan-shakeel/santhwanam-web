import { NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';

import { AppStore } from '../../core/state/app.store';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    NgIf,
    ButtonComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  private readonly appStore = inject(AppStore);

  readonly title = this.appStore.title;
  readonly isAuthenticated = this.appStore.isAuthenticated;
  readonly environment = environment;
}

