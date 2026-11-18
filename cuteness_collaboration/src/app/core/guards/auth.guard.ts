import { inject }                from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService }           from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  const authenticated = authService.isAuthenticated();
  // #region agent log
  fetch('http://127.0.0.1:7888/ingest/673d7c49-1923-46e3-a3c2-3ff94659600c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d91175'},body:JSON.stringify({sessionId:'d91175',location:'auth.guard.ts:9',message:'auth guard decision',data:{url:state.url,authenticated,storedRole:authService.getRole()},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  if (authenticated) return true;

  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });
};