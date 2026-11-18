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
  const token = authService.getToken();
  let jwtRole: string | null = null;
  try {
    jwtRole = token ? (JSON.parse(atob(token.split('.')[1])) as { role?: string }).role ?? null : null;
  } catch {
    jwtRole = null;
  }
  const allowed = !!(userRole && allowedRoles.includes(userRole));
  // #region agent log
  fetch('http://127.0.0.1:7888/ingest/673d7c49-1923-46e3-a3c2-3ff94659600c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d91175'},body:JSON.stringify({sessionId:'d91175',location:'role.guard.ts:17',message:'role guard decision',data:{storedRole:userRole,jwtRole,rolesMatch:userRole===jwtRole,allowedRoles,allowed},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  if (allowed) return true;

  return router.createUrlTree(['/unauthorized']);
};