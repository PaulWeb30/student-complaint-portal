import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ApiErrorService } from './api-error.service';
import { AuthService } from './auth.service';

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const apiErrorService = inject(ApiErrorService);
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        const url = req.url || '';
        const isAuthEndpoint =
          url.includes('/auth/login') ||
          url.includes('/auth/register') ||
          url.includes('/auth/logout') ||
          url.includes('/users/me');

        auth.resetSession();
        if (!isAuthEndpoint && router.url !== '/login') {
          router.navigateByUrl('/login');
        }
      }
      const message = apiErrorService.handle(error);
      return throwError(() => new Error(message));
    }),
  );
};
