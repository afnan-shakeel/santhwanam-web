import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig, inject, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { loggingInterceptor } from './core/interceptors/logging.interceptor';
import { AuthService } from './core/services/auth.service';

/**
 * Initialize authentication state on app startup
 * Checks for existing token and loads auth context if valid
 */
function initializeAuth(): () => Promise<boolean> {
  const authService = inject(AuthService);
  return () => firstValueFrom(authService.initializeAuth());
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, loadingInterceptor, errorInterceptor, loggingInterceptor])
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      multi: true
    }
  ]
};
