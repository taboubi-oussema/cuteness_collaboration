import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ComptableStateService } from '../../services/comptable-state.service';
import { environment } from '../../../../../environments/environment';

interface Commande {
  id: number;
  dateCommande: string;
  statut: string;
  nomPartenaire: string;
  regionPartenaire: string;
  montantOriginal: number;
  montantReduction: number;
  tauxReduction: number;
  montantTotal: number;
  fraisLivraison: number;
  modePaiement: string;
  optionRemise: string;
  remboursementApprouve: boolean;
  navexRef: string;
  lignes: any[];
}

@Component({
  selector: 'app-comptable-rapports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comptable-rapports.html',
  styleUrls: ['../../dashboard/comptable-dashboard.css'],
})
export class ComptableRapportsComponent implements OnInit {
  readonly state = inject(ComptableStateService);
  private http   = inject(HttpClient);

  activeReport: 'synthese' | 'commandes' = 'synthese';

  periode = 'mars-2026';
  rapportGenere = false;

  commandes: Commande[] = [];
  filtreStatutCmd = 'TOUS';
  searchCmd = '';
  filtreDateDebut = '';
  filtreDateFin = '';
  isLoadingCmd = false;

  readonly statutsCmd = ['TOUS', 'EN_ATTENTE', 'EN_PREPARATION', 'LIVREE', 'RETOURNEE', 'ANNULEE'];

  get kpis() { return this.state.kpis$.value; }
  get totalEnAttente() {
    return this.state.commissionsEnAttente.reduce((s, c) => s + c.montant, 0);
  }

  ngOnInit(): void {
    this.loadCommandes();
  }

  loadCommandes(): void {
    this.isLoadingCmd = true;
    this.http.get<Commande[]>(`${environment.apiUrl}/commandes`).subscribe({
      next: (data) => {
        this.commandes = (data ?? []).sort(
          (a, b) => new Date(b.dateCommande).getTime() - new Date(a.dateCommande).getTime()
        );
        this.isLoadingCmd = false;
      },
      error: () => { this.isLoadingCmd = false; },
    });
  }

  get filteredCommandes(): Commande[] {
    return this.commandes.filter(c => {
      const matchStatut = this.filtreStatutCmd === 'TOUS' || c.statut === this.filtreStatutCmd;
      const term = this.searchCmd.toLowerCase();
      const matchSearch = !term
        || c.nomPartenaire?.toLowerCase().includes(term)
        || String(c.id).includes(term)
        || c.regionPartenaire?.toLowerCase().includes(term);
      const date = c.dateCommande ? new Date(c.dateCommande) : null;
      const matchDebut = !this.filtreDateDebut || (date && date >= new Date(this.filtreDateDebut));
      const matchFin   = !this.filtreDateFin   || (date && date <= new Date(this.filtreDateFin + 'T23:59:59'));
      return matchStatut && matchSearch && matchDebut && matchFin;
    });
  }

  get totalCommandes(): number { return this.filteredCommandes.length; }

  get totalBrut(): number {
    return this.filteredCommandes.reduce((s, c) => s + (c.montantOriginal ?? 0), 0);
  }

  get totalReduction(): number {
    return this.filteredCommandes.reduce((c, cmd) => {
      const taux = cmd.tauxReduction ?? 0;
      const brut = cmd.montantOriginal ?? 0;
      const stored = cmd.montantReduction ?? 0;
      return c + (stored > 0 ? stored : Math.round(brut * (taux / 100) * 100) / 100);
    }, 0);
  }

  get totalNet(): number {
    return this.filteredCommandes.reduce((s, c) => s + (c.montantTotal ?? 0), 0);
  }

  get commandesLivrees(): number {
    return this.filteredCommandes.filter(c => c.statut === 'LIVREE').length;
  }

  get commandesEnCours(): number {
    return this.filteredCommandes.filter(
      c => c.statut === 'EN_ATTENTE' || c.statut === 'EN_PREPARATION'
    ).length;
  }

  statutClass(s: string): string {
    const map: Record<string, string> = {
      EN_ATTENTE: 'st-EN_ATTENTE', EN_PREPARATION: 'st-EN_PREPARATION',
      LIVREE: 'st-LIVREE', RETOURNEE: 'st-RETOURNEE', ANNULEE: 'st-ANNULEE',
    };
    return map[s] ?? '';
  }

  exporterCSV(type: 'commissions' | 'transactions' | 'virements'): void {
    this.state.exporterCSV(type, this.periode);
  }

  exporterCommandesCSV(): void {
    const headers = ['ID', 'Partenaire', 'Région', 'Date', 'Statut', 'Brut (DT)', 'Réduction (DT)', 'Taux (%)', 'Frais livraison', 'Net TTC (DT)', 'Option remise', 'Navex'];
    const rows = this.filteredCommandes.map(c => {
      const taux = c.tauxReduction ?? 0;
      const brut = c.montantOriginal ?? 0;
      const stored = c.montantReduction ?? 0;
      const reduction = stored > 0 ? stored : Math.round(brut * (taux / 100) * 100) / 100;
      return [
        c.id,
        c.nomPartenaire,
        c.regionPartenaire,
        c.dateCommande ? new Date(c.dateCommande).toLocaleDateString('fr-FR') : '',
        c.statut,
        brut.toFixed(2),
        reduction.toFixed(2),
        taux,
        (c.fraisLivraison ?? 9).toFixed(2),
        (c.montantTotal ?? 0).toFixed(2),
        c.optionRemise ?? '',
        c.navexRef ?? '',
      ];
    });
    const csvContent = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commandes-rapport.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  padId(id: number): string {
    return String(id).padStart(3, '0');
  }

  exporterPDF(): void { window.print(); }

  genererRapport(): void {
    this.rapportGenere = true;
    setTimeout(() => (this.rapportGenere = false), 3000);
  }
}
