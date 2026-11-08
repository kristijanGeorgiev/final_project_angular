
import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';

import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth-service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const apiUrls = [
    environment.api.auth,
    environment.api.clients,
    environment.api.clientTypes,
    environment.api.statistics
  ];

  const isApiRequest = apiUrls.some(url =>
    req.url === url ||
    req.url.startsWith(`${url}/`) ||
    req.url.startsWith(`${url}?`)
  );

  if (!isApiRequest) {
    return next(req);
  }

  const isLoginRequest =
    req.url === `${environment.api.auth}/login`;

  // Login requests must not include an existing JWT.
  if (isLoginRequest) {
    return next(
      req.clone({
        headers: req.headers.delete('Authorization')
      })
    );
  }

  const token = authService.getToken();

  const authRequest = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    : req;

  return next(authRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.clearSession();

        const returnUrl = router.url;

        void router.navigate(['/login'], {
          queryParams: { returnUrl }
        });
      }

      return throwError(() => error);
    })
  );
};