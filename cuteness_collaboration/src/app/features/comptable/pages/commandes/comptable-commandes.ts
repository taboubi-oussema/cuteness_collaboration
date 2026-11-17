import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';

interface Commande {
  id: number;
  dateCommande: string;
  statut: string;
  nomPartenaire: string;
  emailPartenaire: string;
  telephonePartenaire: string;
  regionPartenaire: string;
  montantOriginal: number;
  montantReduction: number;
  montantTotal: number;
  tauxReduction: number;
  fraisLivraison: number;
  modePaiement: string;
  optionRemise: string;
  adresse: string;
  navexRef: string;
  navexStatut: string;
  confirmationComptableRequise: boolean;
  typeConfirmation: string;
  remboursementApprouve: boolean;
  nomPack: string;
  lignes: any[];
}

interface Inscription {
  id: number;
  statut: string;
  dateCreation: string;
  nomClient: string;
  emailClient: string;
  telephone: string;
  region: string;
  nomPack: string;
  prixPack: number;
  modePaiement: string;
  nomParrain: string;
  nomSuperviseur: string | null;
  navexRef: string | null;
}

@Component({
  selector: 'app-comptable-commandes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comptable-commandes.html',
  styleUrls: ['../../dashboard/comptable-dashboard.css'],
})
export class ComptableCommandesComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);

  allCommandes: Commande[] = [];
  commandesAConfirmer: Commande[] = [];
  inscriptions: Inscription[] = [];

  typeCommande: 'produits' | 'packs' = 'produits';
  activeTab: 'toutes' | 'navex' | 'remboursements' = 'toutes';
  filtreStatut = 'TOUS';
  searchTerm = '';
  filtreStatutPack = 'TOUS';
  searchPack = '';
  expandedInscId: number | null = null;

  readonly statutsPack = ['TOUS', 'NOUVELLE', 'EN_COURS', 'TRAITEE', 'LIVREE'];

  isLoading = false;
  successMsg = '';
  errorMsg = '';
  deletingId: number | null = null;

  expandedId: number | null = null;

  autoRefresh = false;
  lastRefresh: Date | null = null;
  private refreshInterval: any;

  readonly statuts = ['TOUS', 'EN_ATTENTE', 'EN_PREPARATION', 'LIVREE', 'RETOURNEE', 'ANNULEE'];

  ngOnInit(): void {
    this.loadAll();
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;
    if (this.autoRefresh) {
      this.refreshInterval = setInterval(() => this.loadAll(), 30000);
    } else {
      clearInterval(this.refreshInterval);
    }
  }

  loadAll(): void {
    this.lastRefresh = new Date();
    this.isLoading = true;
    this.http.get<Commande[]>(`${environment.apiUrl}/commandes`).subscribe({
      next: (data) => { this.allCommandes = data ?? []; this.isLoading = false; },
      error: () => { this.isLoading = false; },
    });
    this.http.get<Commande[]>(`${environment.apiUrl}/commandes/a-confirmer`).subscribe({
      next: (data) => { this.commandesAConfirmer = data ?? []; },
      error: () => {},
    });
    this.http.get<Inscription[]>(`${environment.apiUrl}/inscriptions`).subscribe({
      next: (data) => { this.inscriptions = data ?? []; },
      error: () => {},
    });
  }

  get filteredCommandes(): Commande[] {
    return this.allCommandes
      .filter(c => {
        const matchStatut = this.filtreStatut === 'TOUS' || c.statut === this.filtreStatut;
        const term = this.searchTerm.toLowerCase();
        const matchSearch = !term
          || c.nomPartenaire?.toLowerCase().includes(term)
          || String(c.id).includes(term)
          || c.regionPartenaire?.toLowerCase().includes(term);
        return matchStatut && matchSearch;
      })
      .sort((a, b) => new Date(b.dateCommande).getTime() - new Date(a.dateCommande).getTime());
  }

  get remboursementsAApprouver(): Commande[] {
    return this.allCommandes.filter(
      c => c.statut === 'LIVREE' && c.optionRemise === 'REMBOURSEMENT' && !c.remboursementApprouve
    );
  }

  get navexCount(): number { return this.commandesAConfirmer.length; }
  get rembCount(): number { return this.remboursementsAApprouver.length; }

  get filteredInscriptions(): Inscription[] {
    return this.inscriptions.filter(i => {
      const matchStatut = this.filtreStatutPack === 'TOUS' || i.statut === this.filtreStatutPack;
      const term = this.searchPack.toLowerCase();
      const matchSearch = !term
        || i.nomClient?.toLowerCase().includes(term)
        || String(i.id).includes(term)
        || i.nomPack?.toLowerCase().includes(term)
        || i.region?.toLowerCase().includes(term);
      return matchStatut && matchSearch;
    });
  }

  inscStatutClass(s: string): string {
    const map: Record<string, string> = {
      NOUVELLE: 'st-EN_ATTENTE', EN_COURS: 'st-EN_PREPARATION',
      TRAITEE: 'st-EN_PREPARATION', LIVREE: 'st-LIVREE',
    };
    return map[s] ?? '';
  }

  confirmerCommande(id: number): void {
    this.http.post<Commande>(`${environment.apiUrl}/commandes/${id}/confirmer`, {}).subscribe({
      next: (res) => {
        const label = res.typeConfirmation === 'RETOUR' ? 'retour confirmé' : 'livraison confirmée';
        this.showSuccess(`Commande #${id} — ${label}.`);
        this.loadAll();
      },
      error: (err) => { this.showError(err?.error?.message ?? 'Erreur lors de la confirmation.'); },
    });
  }

  marquerLivre(c: Commande): void {
    this.http.post<Commande>(`${environment.apiUrl}/commandes/${c.id}/marquer-livre`, {}).subscribe({
      next: (res) => {
        const extra = res.remboursementApprouve ? ' — remboursement crédité sur le solde.' : '.';
        this.showSuccess(`Commande #${c.id} marquée livrée${extra}`);
        this.loadAll();
      },
      error: (err) => { this.showError(err?.error?.message ?? 'Erreur lors du marquage.'); },
    });
  }

  marquerRetour(id: number): void {
    this.http.post<Commande>(`${environment.apiUrl}/commandes/${id}/marquer-retour`, {}).subscribe({
      next: () => {
        this.showSuccess(`Commande #${id} marquée en retour — 5 DT débités du solde.`);
        this.loadAll();
      },
      error: (err) => { this.showError(err?.error?.message ?? 'Erreur lors du marquage en retour.'); },
    });
  }

  approuverRemboursement(id: number): void {
    this.http.post(`${environment.apiUrl}/commandes/${id}/approuver-remboursement`, {}).subscribe({
      next: () => {
        this.showSuccess(`Remboursement #${id} approuvé — solde crédité.`);
        this.loadAll();
      },
      error: (err) => { this.showError(err?.error?.message ?? "Erreur lors de l'approbation."); },
    });
  }

  supprimerCommande(id: number): void {
    if (!confirm(`Supprimer la commande #${id} ? Cette action est irréversible.`)) return;
    this.deletingId = id;
    this.http.delete(`${environment.apiUrl}/commandes/${id}`).subscribe({
      next: () => {
        this.allCommandes = this.allCommandes.filter(c => c.id !== id);
        this.deletingId = null;
        if (this.expandedId === id) this.expandedId = null;
        this.showSuccess(`Commande #${id} supprimée.`);
      },
      error: (err) => {
        this.deletingId = null;
        this.showError(err?.error?.message ?? 'Erreur lors de la suppression.');
      },
    });
  }

  navexTrackingUrl(ref: string): string {
    return `https://app.navex.tn/expediteur/suivi.php?code=${ref}`;
  }

  toggleExpand(id: number): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  statutClass(statut: string): string {
    const map: Record<string, string> = {
      EN_ATTENTE: 'st-EN_ATTENTE',
      EN_PREPARATION: 'st-EN_PREPARATION',
      LIVREE: 'st-LIVREE',
      RETOURNEE: 'st-RETOURNEE',
      ANNULEE: 'st-ANNULEE',
    };
    return map[statut] ?? '';
  }

  marquerInscriptionLivree(id: number): void {
    this.http.post(`${environment.apiUrl}/inscriptions/${id}/marquer-livree`, {}).subscribe({
      next: () => {
        this.inscriptions = this.inscriptions.map(i =>
          i.id === id ? { ...i, statut: 'LIVREE' } : i
        );
        this.showSuccess(`Inscription #${id} marquée livrée.`);
      },
      error: (err) => { this.showError(err?.error?.message ?? 'Erreur lors du marquage.'); },
    });
  }

  private showSuccess(msg: string): void {
    this.successMsg = msg;
    setTimeout(() => this.successMsg = '', 5000);
  }
  private showError(msg: string): void {
    this.errorMsg = msg;
    setTimeout(() => this.errorMsg = '', 5000);
  }
}
