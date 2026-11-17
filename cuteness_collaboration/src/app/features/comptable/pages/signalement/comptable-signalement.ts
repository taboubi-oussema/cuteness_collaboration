import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

const BASE = `${environment.apiUrl}/signalements`;

@Component({
  selector: 'app-comptable-signalement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comptable-signalement.html',
  styleUrls: ['../../dashboard/comptable-dashboard.css'],
})
export class ComptableSignalementComponent implements OnInit {
  private http = inject(HttpClient);

  // ── Form state ──────────────────────────────────────────
  sigType     = 'COMMISSION';
  sigDesc     = '';
  sigPriorite = 'MOYENNE';
  sigFile: File | null = null;
  sigLoading  = false;
  sigSuccess  = '';
  sigError    = '';

  // ── List state ──────────────────────────────────────────
  signalements: any[] = [];
  listLoading = true;
  listError   = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.listLoading = true;
    this.listError   = '';
    this.http.get<any[]>(`${BASE}/mes-signalements`).subscribe({
      next: (data) => {
        this.signalements = data ?? [];
        this.listLoading  = false;
      },
      error: () => {
        this.listError   = 'Impossible de charger vos signalements.';
        this.listLoading = false;
      },
    });
  }

  onFileChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.sigFile = input.files?.[0] ?? null;
  }

  envoyerSignalement(): void {
    if (!this.sigDesc.trim()) { this.sigError = 'Veuillez décrire le problème.'; return; }
    this.sigLoading = true;
    this.sigError   = '';
    const fd = new FormData();
    fd.append('type',        this.sigType);
    fd.append('description', this.sigDesc.trim());
    fd.append('priorite',    this.sigPriorite);
    if (this.sigFile) fd.append('file', this.sigFile);
    this.http.post<any>(BASE, fd).subscribe({
      next: (res) => {
        this.sigLoading = false;
        this.sigSuccess = 'Signalement envoyé au superviseur !';
        this.signalements = [res, ...this.signalements];
        this.sigDesc = '';
        this.sigFile = null;
        setTimeout(() => (this.sigSuccess = ''), 3500);
      },
      error: (err) => {
        this.sigLoading = false;
        this.sigError = err?.error?.message ?? 'Erreur lors de l\'envoi.';
      },
    });
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

  statutLabel(s: string): string {
    const m: Record<string, string> = {
      ENVOYE: 'Envoyé', EN_COURS: 'En cours', ESCALADE: 'Escaladé', RESOLU: 'Résolu',
    };
    return m[s] ?? s;
  }

  typeLabel(t: string): string {
    const m: Record<string, string> = {
      COMMANDE: 'Commande', PAIEMENT: 'Paiement',
      COMMISSION: 'Commission', TECHNIQUE: 'Technique',
    };
    return m[t] ?? t;
  }
}
