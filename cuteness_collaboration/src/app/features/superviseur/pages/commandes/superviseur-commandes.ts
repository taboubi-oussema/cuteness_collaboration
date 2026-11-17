import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { environment } from '../../../../../environments/environment';

interface Partenaire {
  id: number; nom: string; email: string; region: string; telephone: string;
}

interface Produit {
  id: number; nom: string; prix: number; stock: number;
}

interface LigneForm {
  produitId: number | null; quantite: number; prixUnitaire: number; nomProduit: string;
}

export type StatutCommande = 'EN_ATTENTE' | 'EN_PREPARATION' | 'LIVREE' | 'ANNULEE' | 'RETOURNEE';
export type StatutDemande  = 'NOUVELLE' | 'EN_COURS' | 'TRAITEE';

export interface LigneCommande {
  id: number; nomProduit: string; quantite: number; prixUnitaire: number; sousTotal: number;
}

export interface Commande {
  id: number; partenaire: string; email: string; pack: string; souspack: string;
  region: string; montant: number; modePaiement: string; statut: StatutCommande;
  date: string; adresse: string; telephone: string;
  optionRemise: string; remboursementApprouve: boolean;
  navexRef: string; navexStatut: string;
  confirmationComptableRequise: boolean; typeConfirmation: string;
  lignes: LigneCommande[];
}

export interface DemandeInscription {
  id: number; statut: StatutDemande; dateCreation: string;
  userId: number; nomClient: string; emailClient: string;
  telephone: string; region: string; nomPack: string; prixPack: number;
  modePaiement: string; nomParrain: string; codeParrainage: string;
  nomSuperviseur: string | null; navexRef: string | null;
}

@Component({
  selector: 'app-superviseur-commandes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './superviseur-commandes.html',
  styleUrls: ['../../dashboard/superviseur-dashboard.css', './superviseur-commandes.css'],
})
export class SuperviseurCommandesComponent implements OnInit {
  private http     = inject(HttpClient);
  private dashSvc  = inject(DashboardService);

  // ── Tab ─────────────────────────────────────────────
  onglet: 'inscriptions' | 'commandes' = 'inscriptions';

  // ── Inscriptions ────────────────────────────────────
  inscriptions: DemandeInscription[] = [];
  inscLoading = true;
  inscError   = '';
  inscSuccess = '';

  // ── Commandes ───────────────────────────────────────
  commandes: Commande[] = [];
  isLoading    = true;
  errorMsg     = '';
  successMsg   = '';
  filtreStatut = 'TOUS';
  recherche    = '';
  commandeSelectionnee: Commande | null = null;
  confirmAction: { id: number; statut: StatutCommande } | null = null;

  // ── Navex auto-création ──────────────────────────────────
  navexLoadingId: number | null = null;

  // ── Créer commande modal ─────────────────────────────────
  showCreerCommandeModal = false;
  partenaires: Partenaire[] = [];
  produits: Produit[] = [];
  creerLoading = false;
  modalError   = '';
  modalSuccess = '';
  nouvelleCommande = {
    partenaireEmail: '',
    adresse: '',
    modePaiement: 'CARTE',
    optionRemise: 'IMMEDIATE',
    lignes: [] as LigneForm[],
  };

  readonly STATUTS: StatutCommande[] = ['EN_ATTENTE', 'EN_PREPARATION', 'LIVREE', 'ANNULEE', 'RETOURNEE'];

  ngOnInit(): void {
    this.loadInscriptions();
    this.loadCommandes();
    this.loadPartenaires();
    this.loadProduits();
  }

  // ── Inscriptions methods ─────────────────────────────
  loadInscriptions(): void {
    this.inscLoading = true;
    this.dashSvc.getMesInscriptions().subscribe({
      next: (data) => {
        this.inscriptions = (data ?? []).map((d: any): DemandeInscription => ({
          id: d.id, statut: d.statut, dateCreation: d.dateCreation
            ? new Date(d.dateCreation).toLocaleDateString('fr-FR') : '',
          userId: d.userId, nomClient: d.nomClient ?? '', emailClient: d.emailClient ?? '',
          telephone: d.telephone ?? '', region: d.region ?? '', nomPack: d.nomPack ?? 'Aucun',
          prixPack: Number(d.prixPack ?? 0), modePaiement: d.modePaiement ?? '',
          nomParrain: d.nomParrain ?? '—', codeParrainage: d.codeParrainage ?? '',
          nomSuperviseur: d.nomSuperviseur ?? null, navexRef: d.navexRef ?? null,
        }));
        this.inscLoading = false;
      },
      error: () => {
        this.inscError = 'Impossible de charger les demandes d\'inscription.';
        this.inscLoading = false;
      },
    });
  }

  prendreEnChargeInsc(id: number): void {
    this.dashSvc.prendreEnChargeInscription(id).subscribe({
      next: () => {
        const d = this.inscriptions.find(x => x.id === id);
        if (d) { d.statut = 'EN_COURS'; d.nomSuperviseur = 'Vous'; }
        this.inscSuccess = 'Demande prise en charge avec succès.';
        setTimeout(() => this.inscSuccess = '', 3000);
      },
      error: (err) => {
        this.inscError = err?.error?.message ?? 'Erreur lors de la prise en charge.';
        setTimeout(() => this.inscError = '', 4000);
      },
    });
  }

  marquerTraitee(id: number): void {
    this.dashSvc.marquerInscriptionTraitee(id).subscribe({
      next: () => {
        const d = this.inscriptions.find(x => x.id === id);
        if (d) d.statut = 'TRAITEE';
        this.inscSuccess = 'Demande marquée comme traitée.';
        setTimeout(() => this.inscSuccess = '', 3000);
      },
      error: (err) => {
        this.inscError = err?.error?.message ?? 'Erreur lors du traitement.';
        setTimeout(() => this.inscError = '', 4000);
      },
    });
  }

  creerColisNavex(d: DemandeInscription): void {
    this.dashSvc.creerColisNavex(d.id).subscribe({
      next: (updated) => {
        d.navexRef = updated.navexRef;
        this.inscSuccess = `Colis Navex créé — réf : ${updated.navexRef}`;
        setTimeout(() => this.inscSuccess = '', 5000);
      },
      error: (err) => {
        this.inscError = err?.error?.message ?? 'Erreur lors de la création du colis Navex.';
        setTimeout(() => this.inscError = '', 4000);
      },
    });
  }

  get inscriptionsFiltered(): DemandeInscription[] {
    return this.inscriptions;
  }

  inscBadgeClass(s: string): string {
    return s === 'NOUVELLE' ? 'ib-nouvelle' : s === 'EN_COURS' ? 'ib-en-cours' : 'ib-traitee';
  }

  inscCardClass(d: DemandeInscription): string {
    if (d.statut === 'TRAITEE')    return 'insc-card done';
    if (d.statut === 'EN_COURS')   return d.nomSuperviseur === 'Vous' ? 'insc-card mine' : 'insc-card taken';
    return 'insc-card';
  }

  // ── Commandes methods ────────────────────────────────
  get commandesFiltrees(): Commande[] {
    let list = this.filtreStatut === 'TOUS'
      ? this.commandes.filter(c => c.statut !== 'LIVREE')
      : this.commandes.filter(c => c.statut === this.filtreStatut);
    if (this.recherche.trim()) {
      const q = this.recherche.toLowerCase();
      list = list.filter(c => c.partenaire.toLowerCase().includes(q) || c.pack.toLowerCase().includes(q)
        || c.region.toLowerCase().includes(q) || String(c.id).includes(q));
    }
    return list;
  }

  countByStatut(s: string): number {
    if (s === 'TOUS') return this.commandes.filter(c => c.statut !== 'LIVREE').length;
    return this.commandes.filter(c => c.statut === s).length;
  }

  prendreEnCharge(id: number): void {
    this.http.patch(`${environment.apiUrl}/commandes/${id}/statut`, { statut: 'EN_PREPARATION' }).subscribe({
      next: () => {
        const c = this.commandes.find(x => x.id === id);
        if (c) c.statut = 'EN_PREPARATION';
        this.successMsg = `Commande #${id} prise en charge — en préparation.`;
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => {
        this.errorMsg = err?.error?.message ?? 'Erreur lors de la prise en charge.';
        setTimeout(() => this.errorMsg = '', 4000);
      },
    });
  }

  loadCommandes(): void {
    this.isLoading = true;
    this.errorMsg  = '';
    this.http.get<any[]>(`${environment.apiUrl}/commandes`).subscribe({
      next: (data) => {
        this.commandes = (data ?? []).map((c: any): Commande => ({
          id: c.id ?? 0,
          partenaire: c.nomPartenaire ?? c.partenaire ?? 'Inconnu',
          email: c.emailPartenaire ?? c.email ?? '',
          pack: c.pack ?? c.nomPack ?? '',
          souspack: c.sousPack ?? c.souspack ?? '',
          region: c.regionPartenaire ?? c.region ?? '',
          montant: Number(c.montantTotal ?? c.montant ?? 0),
          modePaiement: c.modePaiement ?? '',
          statut: c.statut ?? 'EN_ATTENTE',
          date: c.dateCommande ? new Date(c.dateCommande).toLocaleDateString('fr-FR') : '',
          adresse: c.adresse ?? '',
          telephone: c.telephonePartenaire ?? c.telephone ?? '',
          optionRemise: c.optionRemise ?? '',
          remboursementApprouve: c.remboursementApprouve ?? false,
          navexRef: c.navexRef ?? '',
          navexStatut: c.navexStatut ?? '',
          confirmationComptableRequise: c.confirmationComptableRequise ?? false,
          typeConfirmation: c.typeConfirmation ?? '',
          lignes: (c.lignes ?? []).map((l: any) => ({
            id: l.id ?? 0,
            nomProduit: l.nomProduit ?? '',
            quantite: l.quantite ?? 0,
            prixUnitaire: l.prixUnitaire ?? 0,
            sousTotal: l.sousTotal ?? 0,
          })),
        }));
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = `Erreur ${err?.status ?? ''} : impossible de charger les commandes.`;
      },
    });
  }

  // ── Navex auto-création livraison ────────────────────────
  creerColisNavexCommande(c: Commande): void {
    this.navexLoadingId = c.id;
    this.errorMsg = '';
    this.http.post<any>(`${environment.apiUrl}/commandes/${c.id}/colis-navex`, {}).subscribe({
      next: (res) => {
        this.navexLoadingId = null;
        const idx = this.commandes.findIndex(x => x.id === c.id);
        if (idx !== -1) {
          this.commandes[idx].navexRef = res.navexRef ?? '';
          this.commandes[idx].statut = res.statut ?? 'EN_PREPARATION';
        }
        if (this.commandeSelectionnee?.id === c.id) {
          this.commandeSelectionnee!.navexRef = res.navexRef ?? '';
          this.commandeSelectionnee!.statut   = res.statut ?? 'EN_PREPARATION';
        }
        this.successMsg = `Colis Navex créé pour commande #${c.id} — réf : ${res.navexRef}`;
        setTimeout(() => this.successMsg = '', 5000);
      },
      error: (err) => {
        this.navexLoadingId = null;
        this.errorMsg = err?.error?.message ?? 'Erreur lors de la création du colis Navex.';
        setTimeout(() => this.errorMsg = '', 4000);
      },
    });
  }

  navexTrackingUrl(ref: string): string {
    return `https://app.navex.tn/expediteur/suivi.php?code=${ref}`;
  }

  changerStatut(id: number, statut: string): void { this.confirmAction = { id, statut: statut as StatutCommande }; }

  confirmerChangement(): void {
    if (!this.confirmAction) return;
    const { id, statut } = this.confirmAction;
    this.confirmAction = null;
    this.http.patch(`${environment.apiUrl}/commandes/${id}/statut`, { statut }).subscribe({
      next: () => {
        const c = this.commandes.find(x => x.id === id);
        if (c) c.statut = statut;
        if (this.commandeSelectionnee?.id === id) this.commandeSelectionnee.statut = statut;
        this.successMsg = `Commande #${id} → ${this.statutLabel(statut)}`;
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => {
        this.errorMsg = `Erreur ${err?.status ?? ''} : impossible de mettre à jour le statut.`;
        setTimeout(() => this.errorMsg = '', 4000);
      },
    });
  }

  annulerConfirmation(): void { this.confirmAction = null; }
  voirDetail(c: Commande): void { this.commandeSelectionnee = this.commandeSelectionnee?.id === c.id ? null : c; }

  // ── Créer commande ───────────────────────────────────────
  ouvrirCreerCommandeModal(): void {
    this.modalError   = '';
    this.modalSuccess = '';
    this.nouvelleCommande = { partenaireEmail: '', adresse: '', modePaiement: 'CARTE', optionRemise: 'IMMEDIATE', lignes: [] };
    this.ajouterLigne();
    this.showCreerCommandeModal = true;
  }

  fermerCreerCommandeModal(): void {
    this.showCreerCommandeModal = false;
    this.modalError   = '';
    this.modalSuccess = '';
  }

  loadPartenaires(): void {
    this.http.get<Partenaire[]>(`${environment.apiUrl}/dashboard/partenaires`).subscribe({
      next: (data) => { this.partenaires = data ?? []; },
      error: () => {},
    });
  }

  loadProduits(): void {
    this.http.get<Produit[]>(`${environment.apiUrl}/produits`).subscribe({
      next: (data) => { this.produits = (data ?? []).filter(p => p.stock > 0); },
      error: () => {},
    });
  }

  ajouterLigne(): void {
    this.nouvelleCommande.lignes.push({ produitId: null, quantite: 1, prixUnitaire: 0, nomProduit: '' });
  }

  retirerLigne(index: number): void {
    this.nouvelleCommande.lignes.splice(index, 1);
  }

  onProduitChange(ligne: LigneForm, newId: any): void {
    const produit = this.produits.find(p => p.id === Number(newId));
    if (produit) {
      ligne.prixUnitaire = produit.prix;
      ligne.nomProduit   = produit.nom;
    } else {
      ligne.prixUnitaire = 0;
      ligne.nomProduit   = '';
    }
  }

  get montantEstime(): number {
    return this.nouvelleCommande.lignes.reduce(
      (sum, l) => sum + (l.prixUnitaire * l.quantite), 0
    ) + 9;
  }

  soumettreNouvelleCommande(): void {
    const { partenaireEmail, adresse, modePaiement, optionRemise, lignes } = this.nouvelleCommande;
    this.modalError = '';
    if (!partenaireEmail) {
      this.modalError = 'Veuillez sélectionner un partenaire.'; return;
    }
    if (!adresse.trim()) {
      this.modalError = 'Veuillez saisir l\'adresse de livraison.'; return;
    }
    if (lignes.length === 0 || lignes.some(l => !l.produitId)) {
      this.modalError = 'Veuillez sélectionner au moins un produit.'; return;
    }
    if (lignes.some(l => l.quantite < 1)) {
      this.modalError = 'La quantité doit être supérieure à 0.'; return;
    }
    this.creerLoading = true;
    const payload = {
      partenaireEmail,
      adresse: adresse.trim(),
      modePaiement,
      optionRemise,
      lignes: lignes.map(l => ({ produitId: Number(l.produitId), quantite: Number(l.quantite) })),
    };
    this.http.post<any>(`${environment.apiUrl}/commandes`, payload).subscribe({
      next: (res) => {
        this.creerLoading = false;
        this.modalSuccess = `✅ Commande #${res.id} créée avec succès !`;
        setTimeout(() => {
          this.showCreerCommandeModal = false;
          this.successMsg = `Commande #${res.id} créée pour ${partenaireEmail}.`;
          setTimeout(() => this.successMsg = '', 5000);
        }, 1200);
        this.loadCommandes();
      },
      error: (err) => {
        this.creerLoading = false;
        this.modalError = err?.error?.message ?? 'Erreur lors de la création de la commande.';
      },
    });
  }

  statutLabel(s: string): string {
    const map: Record<string, string> = {
      EN_ATTENTE: 'En attente', EN_PREPARATION: 'En préparation',
      LIVREE: 'Livrée', ANNULEE: 'Annulée', RETOURNEE: 'Retournée',
    };
    return map[s] ?? s;
  }

  statutClass(s: string): string {
    const map: Record<string, string> = {
      LIVREE: 'st-VALIDEE', EN_PREPARATION: 'st-blue',
      ANNULEE: 'st-REFUSEE', RETOURNEE: 'st-retournee', EN_ATTENTE: 'st-EN_ATTENTE',
    };
    return map[s] ?? 'st-EN_ATTENTE';
  }

}

