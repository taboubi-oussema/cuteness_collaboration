import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

const BASE = `${environment.apiUrl}/signalements`;

@Component({
  selector: 'app-admin-signalements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-signalements.html',
  styleUrls: [
    '../../dashboard/Dashboard.component.css',
    '../../../comptable/dashboard/comptable-dashboard.css',
  ],
})
export class AdminSignalementsComponent implements OnInit {
  private http = inject(HttpClient);

  signalements: any[] = [];
  isLoading  = true;
  successMsg = '';
  errorMsg   = '';

  filtreStatut = 'TOUS';

  // ── Respond modal ────────────────────────────────────────
  showRepondreModal      = false;
  signalementEnReponse: any = null;
  reponseText            = '';
  repondreLoading        = false;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.http.get<any[]>(BASE).subscribe({
      next: (data) => {
        this.signalements = data ?? [];
        this.isLoading    = false;
      },
      error: () => {
        this.errorMsg  = 'Impossible de charger les signalements.';
        this.isLoading = false;
      },
    });
  }

  get signalementsFiltres(): any[] {
    if (this.filtreStatut === 'TOUS') return this.signalements;
    return this.signalements.filter(s => s.statut === this.filtreStatut);
  }

  countByStatut(statut: string): number {
    if (statut === 'TOUS') return this.signalements.length;
    return this.signalements.filter(s => s.statut === statut).length;
  }

  prendreEnCharge(id: number): void {
    this.http.patch<any>(`${BASE}/${id}/prendre-en-charge`, {}).subscribe({
      next: () => {
        const s = this.signalements.find(x => x.id === id);
        if (s) s.statut = 'EN_COURS';
        this.flash('Signalement pris en charge.');
      },
      error: () => this.showError('Erreur lors de la prise en charge.'),
    });
  }

  resoudre(id: number): void {
    this.http.patch<any>(`${BASE}/${id}/resoudre`, {}).subscribe({
      next: () => {
        const s = this.signalements.find(x => x.id === id);
        if (s) s.statut = 'RESOLU';
        this.flash('Signalement résolu.');
      },
      error: () => this.showError('Erreur lors de la résolution.'),
    });
  }

  ouvrirRepondre(sig: any): void {
    this.signalementEnReponse = sig;
    this.reponseText          = sig.reponseAdmin ?? '';
    this.showRepondreModal    = true;
  }

  fermerRepondre(): void {
    this.showRepondreModal    = false;
    this.signalementEnReponse = null;
  }

  confirmerReponse(): void {
    if (!this.reponseText.trim() || !this.signalementEnReponse) return;
    const id = this.signalementEnReponse.id;
    this.repondreLoading = true;
    this.http.patch<any>(`${BASE}/${id}/repondre`, { reponse: this.reponseText.trim() }).subscribe({
      next: (updated) => {
        const s = this.signalements.find(x => x.id === id);
        if (s) {
          s.statut       = 'RESOLU';
          s.reponseAdmin = updated.reponseAdmin;
        }
        this.repondreLoading      = false;
        this.showRepondreModal    = false;
        this.signalementEnReponse = null;
        this.flash('Réponse envoyée — signalement résolu.');
      },
      error: () => {
        this.repondreLoading = false;
        this.showError('Erreur lors de l\'envoi de la réponse.');
      },
    });
  }

  private flash(msg: string): void {
    this.successMsg = msg;
    setTimeout(() => (this.successMsg = ''), 4000);
  }

  private showError(msg: string): void {
    this.errorMsg = msg;
    setTimeout(() => (this.errorMsg = ''), 4000);
  }

  prioriteColor(p: string): string {
    return p === 'HAUTE' ? 'pr-haute' : p === 'MOYENNE' ? 'pr-moyenne' : 'pr-basse';
  }

  statutColor(s: string): string {
    return s === 'RESOLU'   ? 'st-VALIDEE'
         : s === 'EN_COURS' ? 'st-EN_ATTENTE'
         : s === 'ESCALADE' ? 'st-purple'
         : 'st-blue';
  }

  typeLabel(t: string): string {
    const m: Record<string, string> = {
      COMMANDE: 'Commande', PAIEMENT: 'Paiement',
      COMMISSION: 'Commission', TECHNIQUE: 'Technique',
    };
    return m[t] ?? t;
  }

  sourceLabel(s: string): string {
    return s === 'COMPTABLE' ? '📊 Comptable' : '🤝 Partenaire';
  }
}
