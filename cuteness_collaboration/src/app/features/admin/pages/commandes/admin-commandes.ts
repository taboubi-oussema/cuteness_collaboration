import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';

const API = environment.apiUrl;

interface LigneCommande {
  id: number; nomProduit: string; quantite: number; prixUnitaire: number; sousTotal: number;
}

interface Commande {
  id: number; dateCommande: string; statut: string;
  nomPartenaire: string; emailPartenaire: string; telephonePartenaire: string; regionPartenaire: string;
  montantOriginal: number; montantReduction: number; montantTotal: number;
  tauxReduction: number; fraisLivraison: number;
  modePaiement: string; optionRemise: string; adresse: string;
  navexRef: string; navexStatut: string;
  confirmationComptableRequise: boolean; typeConfirmation: string;
  remboursementApprouve: boolean; nomPack: string;
  nomSuperviseur: string | null; emailSuperviseur: string | null;
  lignes: LigneCommande[];
}

interface Inscription {
  id: number; statut: string; dateCreation: string;
  nomClient: string; emailClient: string; telephone: string; region: string;
  nomPack: string; prixPack: number; modePaiement: string;
  nomParrain: string; nomSuperviseur: string | null; navexRef: string | null;
}

@Component({
  selector: 'app-admin-commandes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-commandes.html',
  styleUrls: [
    '../../dashboard/Dashboard.component.css',
    '../../../comptable/dashboard/comptable-dashboard.css',
  ],
})
export class AdminCommandesComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);

  activeTab: 'produits' | 'packs' = 'produits';

  commandes: Commande[] = [];
  commandesAConfirmer: Commande[] = [];
  inscriptions: Inscription[] = [];

  loadingCommandes = false;
  loadingInscriptions = false;
  navexLoadingId: number | null = null;

  filtreStatut = 'TOUS';
  searchTerm = '';
  filtreStatutInsc = 'TOUS';
  searchInsc = '';

  expandedCommandeId: number | null = null;
  expandedInscriptionId: number | null = null;

  successMsg = '';
  errorMsg = '';

  autoRefresh = false;
  lastRefresh: Date | null = null;
  private refreshInterval: any;

  readonly STATUTS = ['TOUS', 'EN_ATTENTE', 'EN_PREPARATION', 'LIVREE', 'RETOURNEE', 'ANNULEE'];
  readonly STATUTS_INSC = ['TOUS', 'NOUVELLE', 'EN_COURS', 'TRAITEE', 'LIVREE'];

  ngOnInit(): void { this.loadAll(); }
  ngOnDestroy(): void { this.stopAutoRefresh(); }

  loadAll(): void {
    this.loadCommandes();
    this.loadInscriptions();
    this.lastRefresh = new Date();
  }

  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;
    if (this.autoRefresh) {
      this.refreshInterval = setInterval(() => this.loadAll(), 30000);
    } else {
      this.stopAutoRefresh();
    }
  }

  private stopAutoRefresh(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  loadCommandes(): void {
    this.loadingCommandes = true;
    this.http.get<Commande[]>(`${API}/commandes`).subscribe({
      next: (data) => { this.commandes = data ?? []; this.loadingCommandes = false; },
      error: () => { this.loadingCommandes = false; },
    });
    this.http.get<Commande[]>(`${API}/commandes/a-confirmer`).subscribe({
      next: (data) => { this.commandesAConfirmer = data ?? []; },
      error: () => {},
    });
  }

  loadInscriptions(): void {
    this.loadingInscriptions = true;
    this.http.get<any[]>(`${API}/inscriptions`).subscribe({
      next: (data) => {
        this.inscriptions = (data ?? []).map((d: any): Inscription => ({
          id: d.id, statut: d.statut,
          dateCreation: d.dateCreation ? new Date(d.dateCreation).toLocaleDateString('fr-FR') : '',
          nomClient: d.nomClient ?? '', emailClient: d.emailClient ?? '',
          telephone: d.telephone ?? '', region: d.region ?? '',
          nomPack: d.nomPack ?? 'Aucun', prixPack: Number(d.prixPack ?? 0),
          modePaiement: d.modePaiement ?? '', nomParrain: d.nomParrain ?? '—',
          nomSuperviseur: d.nomSuperviseur ?? null, navexRef: d.navexRef ?? null,
        }));
        this.loadingInscriptions = false;
      },
      error: () => { this.loadingInscriptions = false; },
    });
  }

  // ── STATS ────────────────────────────────────────────────
  countCommandes(s: string): number {
    return s === 'TOUS' ? this.commandes.length : this.commandes.filter(c => c.statut === s).length;
  }

  countInsc(s: string): number {
    return s === 'TOUS' ? this.inscriptions.length : this.inscriptions.filter(i => i.statut === s).length;
  }

  get pendingNavexConfirm(): number { return this.commandesAConfirmer.length; }

  // ── FILTERS ──────────────────────────────────────────────
  get filteredCommandes(): Commande[] {
    return this.commandes.filter(c => {
      const matchStatut = this.filtreStatut === 'TOUS' || c.statut === this.filtreStatut;
      const q = this.searchTerm.toLowerCase();
      const matchSearch = !q || c.nomPartenaire?.toLowerCase().includes(q)
        || String(c.id).includes(q) || c.regionPartenaire?.toLowerCase().includes(q);
      return matchStatut && matchSearch;
    });
  }

  get filteredInscriptions(): Inscription[] {
    return this.inscriptions.filter(i => {
      const matchStatut = this.filtreStatutInsc === 'TOUS' || i.statut === this.filtreStatutInsc;
      const q = this.searchInsc.toLowerCase();
      const matchSearch = !q || i.nomClient?.toLowerCase().includes(q)
        || String(i.id).includes(q) || i.region?.toLowerCase().includes(q);
      return matchStatut && matchSearch;
    });
  }

  // ── ACTIONS — COMMANDES PRODUITS ─────────────────────────
  creerColisNavex(c: Commande): void {
    this.navexLoadingId = c.id;
    this.http.post<any>(`${API}/commandes/${c.id}/colis-navex`, {}).subscribe({
      next: (res) => {
        this.navexLoadingId = null;
        const idx = this.commandes.findIndex(x => x.id === c.id);
        if (idx !== -1) { this.commandes[idx].navexRef = res.navexRef; this.commandes[idx].statut = res.statut; }
        this.showSuccess(`Colis Navex créé pour #${c.id} — réf : ${res.navexRef}`);
      },
      error: (err) => { this.navexLoadingId = null; this.showError(err?.error?.message ?? 'Erreur Navex.'); },
    });
  }

  marquerLivre(c: Commande): void {
    this.http.post<Commande>(`${API}/commandes/${c.id}/marquer-livre`, {}).subscribe({
      next: (res) => {
        const idx = this.commandes.findIndex(x => x.id === c.id);
        if (idx !== -1) this.commandes[idx] = { ...this.commandes[idx], ...res };
        const extra = res.remboursementApprouve ? ' — remboursement crédité.' : '.';
        this.showSuccess(`Commande #${c.id} livrée${extra}`);
      },
      error: (err) => { this.showError(err?.error?.message ?? 'Erreur livraison.'); },
    });
  }

  marquerRetour(id: number): void {
    this.http.post<Commande>(`${API}/commandes/${id}/marquer-retour`, {}).subscribe({
      next: (res) => {
        const idx = this.commandes.findIndex(x => x.id === id);
        if (idx !== -1) this.commandes[idx] = { ...this.commandes[idx], ...res };
        this.showSuccess(`Commande #${id} retournée — 5 DT débités.`);
      },
      error: (err) => { this.showError(err?.error?.message ?? 'Erreur retour.'); },
    });
  }

  approuverRemboursement(id: number): void {
    this.http.post<Commande>(`${API}/commandes/${id}/approuver-remboursement`, {}).subscribe({
      next: () => {
        const c = this.commandes.find(x => x.id === id);
        if (c) c.remboursementApprouve = true;
        this.showSuccess(`Remboursement #${id} approuvé.`);
      },
      error: (err) => { this.showError(err?.error?.message ?? 'Erreur remboursement.'); },
    });
  }

  confirmerCommande(id: number): void {
    this.http.post<Commande>(`${API}/commandes/${id}/confirmer`, {}).subscribe({
      next: (res) => {
        this.commandesAConfirmer = this.commandesAConfirmer.filter(c => c.id !== id);
        const idx = this.commandes.findIndex(x => x.id === id);
        if (idx !== -1) this.commandes[idx] = { ...this.commandes[idx], ...res };
        const label = res.typeConfirmation === 'RETOUR' ? 'retour confirmé' : 'livraison confirmée';
        this.showSuccess(`Commande #${id} — ${label}.`);
      },
      error: (err) => { this.showError(err?.error?.message ?? 'Erreur confirmation.'); },
    });
  }

  annulerCommande(id: number): void {
    this.http.patch<Commande>(`${API}/commandes/${id}/statut`, { statut: 'ANNULEE' }).subscribe({
      next: () => {
        const c = this.commandes.find(x => x.id === id);
        if (c) c.statut = 'ANNULEE';
        this.showSuccess(`Commande #${id} annulée.`);
      },
      error: (err) => { this.showError(err?.error?.message ?? 'Erreur annulation.'); },
    });
  }

  // ── ACTIONS — INSCRIPTIONS PACKS ─────────────────────────
  creerColisNavexInsc(id: number): void {
    this.http.post<any>(`${API}/inscriptions/${id}/colis-navex`, {}).subscribe({
      next: (res) => {
        const i = this.inscriptions.find(x => x.id === id);
        if (i) i.navexRef = res.navexRef;
        this.showSuccess(`Colis Navex créé — réf : ${res.navexRef}`);
      },
      error: (err) => { this.showError(err?.error?.message ?? 'Erreur Navex inscription.'); },
    });
  }

  marquerLivreeInsc(id: number): void {
    this.http.post<any>(`${API}/inscriptions/${id}/marquer-livree`, {}).subscribe({
      next: () => {
        const i = this.inscriptions.find(x => x.id === id);
        if (i) i.statut = 'LIVREE';
        this.showSuccess(`Inscription #${id} marquée livrée.`);
      },
      error: (err) => { this.showError(err?.error?.message ?? 'Erreur livraison inscription.'); },
    });
  }

  // ── HELPERS ──────────────────────────────────────────────
  navexUrl(ref: string): string {
    return `https://app.navex.tn/expediteur/suivi.php?code=${ref}`;
  }

  toggleCommande(id: number): void {
    this.expandedCommandeId = this.expandedCommandeId === id ? null : id;
  }

  toggleInscription(id: number): void {
    this.expandedInscriptionId = this.expandedInscriptionId === id ? null : id;
  }

  statutLabel(s: string): string {
    const m: Record<string, string> = {
      EN_ATTENTE: 'En attente', EN_PREPARATION: 'En préparation',
      LIVREE: 'Livrée', RETOURNEE: 'Retournée', ANNULEE: 'Annulée',
    };
    return m[s] ?? s;
  }

  statutClass(s: string): string {
    const m: Record<string, string> = {
      EN_ATTENTE: 'st-EN_ATTENTE', EN_PREPARATION: 'st-blue',
      LIVREE: 'st-VALIDEE', RETOURNEE: 'st-retournee', ANNULEE: 'st-REFUSEE',
    };
    return m[s] ?? '';
  }

  statutLabelInsc(s: string): string {
    const m: Record<string, string> = {
      NOUVELLE: 'Nouvelle', EN_COURS: 'En cours', TRAITEE: 'Traitée', LIVREE: 'Livrée',
    };
    return m[s] ?? s;
  }

  statutClassInsc(s: string): string {
    const m: Record<string, string> = {
      NOUVELLE: 'st-EN_ATTENTE', EN_COURS: 'st-blue', TRAITEE: 'st-orange', LIVREE: 'st-VALIDEE',
    };
    return m[s] ?? '';
  }

  private showSuccess(msg: string): void {
    this.successMsg = msg; setTimeout(() => this.successMsg = '', 5000);
  }
  private showError(msg: string): void {
    this.errorMsg = msg; setTimeout(() => this.errorMsg = '', 5000);
  }
}
