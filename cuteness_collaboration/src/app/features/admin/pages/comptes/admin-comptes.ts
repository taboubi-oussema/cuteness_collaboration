import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../../../core/services/dashboard.service';

@Component({
  selector: 'app-admin-comptes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-comptes.html',
  styleUrls: [
    '../../dashboard/Dashboard.component.css',
    '../../../comptable/dashboard/comptable-dashboard.css',
  ],
})
export class AdminComptesComponent implements OnInit {
  private dashSvc = inject(DashboardService);

  comptes: any[] = [];
  isLoading = true;
  successMsg = '';
  errorMsg = '';
  processingId: number | null = null;

  searchTerm = '';
  filtreRegion = 'TOUS';
  filtrePack = 'TOUS';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.dashSvc.getComptesEnAttente().subscribe({
      next: (data) => { this.comptes = data ?? []; this.isLoading = false; },
      error: () => {
        this.errorMsg = 'Impossible de charger les comptes en attente.';
        this.isLoading = false;
      },
    });
  }

  get regions(): string[] {
    const set = new Set(this.comptes.map(c => c.region).filter(Boolean));
    return ['TOUS', ...Array.from(set).sort()];
  }

  get packs(): string[] {
    const set = new Set(this.comptes.map(c => c.pack).filter(Boolean));
    return ['TOUS', ...Array.from(set).sort()];
  }

  get comptesFiltres(): any[] {
    return this.comptes.filter(c => {
      const term = this.searchTerm.toLowerCase();
      const matchSearch = !term
        || c.nom?.toLowerCase().includes(term)
        || c.email?.toLowerCase().includes(term)
        || c.telephone?.toLowerCase().includes(term)
        || String(c.id).includes(term);
      const matchRegion = this.filtreRegion === 'TOUS' || c.region === this.filtreRegion;
      const matchPack = this.filtrePack === 'TOUS' || c.pack === this.filtrePack;
      return matchSearch && matchRegion && matchPack;
    });
  }

  initiales(nom: string): string {
    if (!nom) return '?';
    return nom.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  approuver(id: number, nom: string): void {
    this.processingId = id;
    this.dashSvc.approuverCompte(id).subscribe({
      next: () => {
        this.comptes = this.comptes.filter(c => c.id !== id);
        this.processingId = null;
        this.flash(`Compte de ${nom} activé avec succès.`);
      },
      error: (err) => {
        this.processingId = null;
        this.showError(err?.error?.message ?? "Erreur lors de l'activation.");
      },
    });
  }

  rejeter(id: number, nom: string): void {
    if (!confirm(`Rejeter le compte de ${nom} ? Cette action enverra une notification de rejet.`)) return;
    this.processingId = id;
    this.dashSvc.rejeterCompte(id).subscribe({
      next: () => {
        this.comptes = this.comptes.filter(c => c.id !== id);
        this.processingId = null;
        this.flash(`Compte de ${nom} rejeté — notification envoyée.`);
      },
      error: (err) => {
        this.processingId = null;
        this.showError(err?.error?.message ?? 'Erreur lors du rejet.');
      },
    });
  }

  paymentIcon(p: string): string {
    const m: Record<string, string> = {
      ESPECES: '💵', VIREMENT: '🏦', CHEQUE: '📄', CB: '💳',
    };
    return m[p?.toUpperCase()] ?? '💰';
  }

  private flash(msg: string): void {
    this.successMsg = msg;
    setTimeout(() => (this.successMsg = ''), 4000);
  }

  private showError(msg: string): void {
    this.errorMsg = msg;
    setTimeout(() => (this.errorMsg = ''), 4000);
  }
}
