import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, tap, throwError } from 'rxjs';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const started = performance.now();

  return next(req).pipe(
    tap(() => {
      const elapsed = Math.round(performance.now() - started);
      console.info(`[HTTP] ${req.method} ${req.urlWithParams} (${elapsed}ms)`);
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('[HTTP ERROR]', req.method, req.urlWithParams, error.message, {
        status: error.status,
        body: error.error
      });
      return throwError(() => error);
    })
  );
};

