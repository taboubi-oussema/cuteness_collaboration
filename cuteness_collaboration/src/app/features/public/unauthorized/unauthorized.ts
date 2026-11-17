import { Component, inject } from '@angular/core';
import { Router }             from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  template: `
    <div class="unauth-page">
      <div class="unauth-card animate-fadeInUp">
        <div class="unauth-icon">🚫</div>
        <h2>Accès non autorisé</h2>
        <p>Vous n'avez pas les droits pour accéder à cette page.</p>
        <button class="cc-btn primary" (click)="router.navigate(['/auth/login'])">
          <i class="fas fa-arrow-left"></i> Retour à la connexion
        </button>
      </div>
    </div>
  `,
  styles: [`
    .unauth-page { min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--bg); }
    .unauth-card { background:var(--white); border-radius:var(--radius); border:1.5px solid var(--border); box-shadow:var(--shadow); padding:48px 36px; text-align:center; max-width:380px; width:100%; }
    .unauth-icon { font-size:48px; margin-bottom:18px; }
    h2 { font-family:var(--font-display); font-size:22px; font-weight:800; color:var(--text); margin-bottom:10px; }
    p  { font-size:14px; color:var(--text-2); margin-bottom:24px; line-height:1.6; }
  `]
})
export class UnauthorizedComponent {
  router = inject(Router);
}