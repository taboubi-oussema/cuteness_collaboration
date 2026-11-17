import { inject }                from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService }           from '../services/auth.service';
import { Role }                  from '../../shared/models/user.model';

export const roleGuard: CanActivateFn = (route, _state) => {
  const authService  = inject(AuthService);
  const router       = inject(Router);
  const allowedRoles = (route.data['roles'] ?? []) as Role[];

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/auth/login']);
  }

  if (allowedRoles.length === 0) return true;

  const userRole = authService.getRole();
  if (userRole && allowedRoles.includes(userRole)) return true;

  return router.createUrlTree(['/unauthorized']);
};