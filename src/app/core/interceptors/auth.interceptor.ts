import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthTokenService } from '../services/auth-token.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(AuthTokenService);
  const token = tokenService.getToken();

  if (!token) {
    return next(req);
  }

  const authorized = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authorized);
};

