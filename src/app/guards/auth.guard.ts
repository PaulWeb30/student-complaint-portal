import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return auth
    .loadCurrentUser()
    .pipe(map((user) => (user ? true : router.createUrlTree(['/login']))));
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return auth.loadCurrentUser().pipe(
      map((user) => {
        if (!user) {
          return true;
        }

        const target = auth.isAdmin() ? '/admin/complaints' : '/complaints';
        return router.createUrlTree([target]);
      }),
    );
  }

  const target = auth.isAdmin() ? '/admin/complaints' : '/complaints';
  return router.createUrlTree([target]);
};
