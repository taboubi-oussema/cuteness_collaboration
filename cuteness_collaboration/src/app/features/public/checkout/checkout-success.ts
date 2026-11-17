import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-checkout-success',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div style="min-height:100vh;background:#fdf6f3;display:flex;align-items:center;justify-content:center;font-family:inherit">
      <div style="background:#fff;border-radius:20px;border:2px solid #fde8df;padding:3rem 2.5rem;text-align:center;max-width:420px;width:90%">
        <div style="width:70px;height:70px;background:#fff3ef;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;font-size:1.8rem;color:#e8734a">
          <i class="fas fa-check"></i>
        </div>
        <h2 style="font-size:1.4rem;font-weight:900;color:#1a1a1a;margin-bottom:.6rem">Commande confirmée !</h2>
        <p style="color:#888;font-size:.95rem;line-height:1.6;margin-bottom:2rem">
          Votre commande a été transmise au superviseur.<br>Vous serez notifié dès sa prise en charge.
        </p>
        <a routerLink="/boutique" style="display:inline-flex;align-items:center;gap:.5rem;padding:.7rem 1.5rem;background:#e8734a;color:#fff;border-radius:10px;text-decoration:none;font-weight:700">
          <i class="fas fa-shopping-bag"></i> Continuer les achats
        </a>
      </div>
    </div>
  `,
})
export class CheckoutSuccessComponent {}
