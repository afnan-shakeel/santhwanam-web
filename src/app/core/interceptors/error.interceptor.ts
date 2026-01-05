import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { ToastService } from '../services/toast.service';
import { AuthStore } from '../state/auth.store';


interface ApiErrorResponse {
    message: string;
    details?: any;
    statusCode: Number
}

/**
 * Endpoints to skip global error handling (let components handle these)
 * Add endpoints that need custom error handling
 */
const SKIP_GLOBAL_ERROR_ENDPOINTS: string[] = [
    '/auth/login',
    '/auth/refresh-token'
];

/**
 * Track recent toasts to prevent duplicates
 */
let lastToastKey: string | null = null;
let lastToastTime = 0;
const TOAST_DEDUP_WINDOW_MS = 2000; // 2 seconds deduplication window

/**
 * Check if we should skip global error handling for this request
 */
function shouldSkipGlobalErrorHandling(url: string): boolean {
    return SKIP_GLOBAL_ERROR_ENDPOINTS.some(endpoint => url.includes(endpoint));
}

/**
 * Check if toast should be deduplicated
 */
function isDuplicateToast(key: string): boolean {
    const now = Date.now();
    if (lastToastKey === key && (now - lastToastTime) < TOAST_DEDUP_WINDOW_MS) {
        return true;
    }
    lastToastKey = key;
    lastToastTime = now;
    return false;
}

/**
 * Error interceptor for handling global HTTP errors
 * - 401 Unauthorized: Show toast and redirect to login
 * - 500 Internal Server Error: Show generic error toast
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const toastService = inject(ToastService);
    const authStore = inject(AuthStore);
    const router = inject(Router);

    return next(req).pipe(
        catchError((errorResponse: HttpErrorResponse) => {
            // Skip global handling for certain endpoints
            if (shouldSkipGlobalErrorHandling(req.url)) {
                return throwError(() => errorResponse);
            }

            // Handle specific error status codes
            switch (errorResponse.status) {
                case 401:
                    handleUnauthorizedError(toastService, authStore, router);
                    break;

                case 500:
                    handleServerError(toastService);
                    break;

                // Future: Add more status code handlers here
                // case 403:
                //   handleForbiddenError(toastService);
                //   break;
                // case 503:
                //   handleServiceUnavailableError(toastService);
                //   break;

                case 400:
                    handleBadRequestError(toastService, errorResponse.error?.error);
                    break;
            }

            return throwError(() => errorResponse);
        })
    );
};

/**
 * Handle 401 Unauthorized errors
 */
function handleUnauthorizedError(
    toastService: ToastService,
    authStore: AuthStore,
    router: Router
): void {
    const toastKey = '401-unauthorized';

    if (!isDuplicateToast(toastKey)) {
        toastService.error(
            'Session Expired',
            'Your session has expired. Please log in again.'
        );
    }

    // Clear auth state and redirect to login
    authStore.clearAuth();
    router.navigate(['/auth/login']);
}

/**
 * Handle 500 Internal Server errors
 */
function handleServerError(toastService: ToastService): void {
    const toastKey = '500-server-error';

    if (!isDuplicateToast(toastKey)) {
        toastService.error(
            'Something Went Wrong',
            'We encountered an unexpected issue. Please try again later or contact support if the problem persists.'
        );
    }
}


function handleBadRequestError(toastService: ToastService, error: ApiErrorResponse): void {
    const toastKey = '400-bad-request';
    const message = error.message || 'The request could not be understood by the server. Please check your input and try again.'
    toastService.error(
        'Bad Request',
        message
    );
}