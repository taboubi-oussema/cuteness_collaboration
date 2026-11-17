import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

export type PrioriteSignalement = 'HAUTE' | 'MOYENNE' | 'BASSE';
export type StatutSignalement  = 'ENVOYE' | 'EN_COURS' | 'ESCALADE' | 'RESOLU';
export type SourceSignalement  = 'CLIENT' | 'COMPTABLE';

export interface Signalement {
  id: number;
  sujet: string;
  description: string;
  priorite: PrioriteSignalement;
  statut: StatutSignalement;
  source: SourceSignalement;
  auteur: string;
  date: string;
  noteEscalade?: string;
  reponseAdmin?: string;
  reponseSuperviseur?: string;
  fileUrl?: string;
}

const BASE = `${environment.apiUrl}/signalements`;

@Component({
  selector: 'app-superviseur-signalements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './superviseur-signalements.html',
  styleUrls: [
    '../../dashboard/superviseur-dashboard.css',
    './superviseur-signalements.css',
  ],
})
export class SuperviseurSignalementsComponent implements OnInit {
  private http = inject(HttpClient);

  filtreStatut: StatutSignalement | 'TOUS' = 'TOUS';
  filtreSource: SourceSignalement | 'TOUS' = 'TOUS';
  showEscaladeForm = false;
  signalementEnEscalade: Signalement | null = null;
  noteEscalade = '';
  successMsg = '';
  errorMsg   = '';
  isLoading  = true;

  // ── Respond modal ────────────────────────────────────────
  showRepondreModal      = false;
  signalementEnReponse: Signalement | null = null;
  reponseText            = '';
  repondreLoading        = false;

  signalements: Signalement[] = [];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.http.get<any[]>(BASE).subscribe({
      next: (data) => {
        this.signalements = (data ?? []).map((s: any): Signalement => ({
          id:                  s.id,
          sujet:               s.sujet ?? '',
          description:         s.description ?? '',
          priorite:            s.priorite ?? 'MOYENNE',
          statut:              s.statut ?? 'ENVOYE',
          source:              s.source ?? 'CLIENT',
          auteur:              s.auteur ?? '',
          date:                s.date ? new Date(s.date).toLocaleDateString('fr-FR') : '',
          noteEscalade:        s.noteEscalade        || undefined,
          reponseAdmin:        s.reponseAdmin        || undefined,
          reponseSuperviseur:  s.reponseSuperviseur  || undefined,
          fileUrl:             s.fileUrl             || undefined,
        }));
        this.isLoading = false;
      },
      error: () => {
        this.errorMsg = 'Impossible de charger les signalements.';
        this.isLoading = false;
      },
    });
  }

  get signalementsFiltres(): Signalement[] {
    let list = this.signalements;
    if (this.filtreStatut !== 'TOUS') list = list.filter(s => s.statut === this.filtreStatut);
    if (this.filtreSource !== 'TOUS') list = list.filter(s => s.source === this.filtreSource);
    return list;
  }

  countByStatut(s: StatutSignalement | 'TOUS'): number {
    if (s === 'TOUS') return this.signalements.length;
    return this.signalements.filter(x => x.statut === s).length;
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
        this.flash('Signalement marqué comme résolu.');
      },
      error: () => this.showError('Erreur lors de la résolution.'),
    });
  }

  ouvrirEscalade(sig: Signalement): void {
    this.signalementEnEscalade = sig;
    this.noteEscalade = '';
    this.showEscaladeForm = true;
  }

  confirmerEscalade(): void {
    if (!this.signalementEnEscalade) return;
    const id = this.signalementEnEscalade.id;
    const note = this.noteEscalade || "Escaladé à l'administrateur.";
    this.http.patch<any>(`${BASE}/${id}/escalader`, { note }).subscribe({
      next: () => {
        const s = this.signalements.find(x => x.id === id);
        if (s) { s.statut = 'ESCALADE'; s.noteEscalade = note; }
        this.flash(`Signalement #${id} escaladé à l'administrateur.`);
        this.showEscaladeForm = false;
        this.signalementEnEscalade = null;
      },
      error: () => this.showError("Erreur lors de l'escalade."),
    });
  }

  annulerEscalade(): void {
    this.showEscaladeForm = false;
    this.signalementEnEscalade = null;
  }

  ouvrirRepondre(sig: Signalement): void {
    this.signalementEnReponse = sig;
    this.reponseText          = sig.reponseSuperviseur ?? '';
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
    this.http.patch<any>(`${BASE}/${id}/repondre-superviseur`, { reponse: this.reponseText.trim() }).subscribe({
      next: (updated) => {
        const s = this.signalements.find(x => x.id === id);
        if (s) {
          s.statut              = 'RESOLU';
          s.reponseSuperviseur  = updated.reponseSuperviseur;
        }
        this.repondreLoading      = false;
        this.showRepondreModal    = false;
        this.signalementEnReponse = null;
        this.flash('Réponse envoyée — signalement résolu.');
      },
      error: () => {
        this.repondreLoading = false;
        this.showError("Erreur lors de l'envoi de la réponse.");
      },
    });
  }

  private flash(msg: string): void {
    this.successMsg = msg;
    setTimeout(() => this.successMsg = '', 4000);
  }

  private showError(msg: string): void {
    this.errorMsg = msg;
    setTimeout(() => this.errorMsg = '', 4000);
  }

  prioriteColor(p: string): string {
    return p === 'HAUTE' ? 'pr-haute' : p === 'MOYENNE' ? 'pr-moyenne' : 'pr-basse';
  }

  statutColor(s: string): string {
    return s === 'RESOLU'   ? 'st-VALIDEE'
         : s === 'EN_COURS' ? 'st-EN_ATTENTE'
         : s === 'ESCALADE' ? 'st-blue'
         : 'st-blue';
  }

  sourceIcon(s: SourceSignalement): string {
    return s === 'CLIENT' ? '🤝' : '📊';
  }

  openFile(fileUrl: string): void {
    window.open(environment.apiUrl.replace("/api", "") + fileUrl, '_blank');
  }
}
