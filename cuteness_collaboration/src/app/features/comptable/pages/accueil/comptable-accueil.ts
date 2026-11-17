import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ComptableStateService } from '../../services/comptable-state.service';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-comptable-accueil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comptable-accueil.html',
  styleUrls: ['../../dashboard/comptable-dashboard.css'],
})
export class ComptableAccueilComponent implements OnInit {
  readonly state   = inject(ComptableStateService);
  private router   = inject(Router);
  private dashSvc  = inject(DashboardService);
  private http     = inject(HttpClient);

  currentDateLabel = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  inscriptionsTraitees: any[] = [];
  inscSuccess = '';
  inscError   = '';

  inscriptionsEnCours: any[] = [];

  commandesEnCours: any[] = [];
  cmdSuccess = '';
  cmdError   = '';

  commandesRemboursement: any[] = [];
  rembSuccess = '';
  rembError   = '';

  commandesAConfirmer: any[] = [];
  navexSuccess = '';
  navexError   = '';

  ngOnInit(): void {
    this.state.load();
    this.loadInscriptionsTraitees();
    this.loadInscriptionsEnCours();
    this.loadCommandesEnCours();
    this.loadCommandesRemboursement();
    this.loadCommandesAConfirmer();
  }

  loadInscriptionsTraitees(): void {
    this.dashSvc.getInscriptionsTraitees().subscribe({
      next: (data) => { this.inscriptionsTraitees = data ?? []; },
      error: () => {},
    });
  }

  loadInscriptionsEnCours(): void {
    this.http.get<any[]>(`${environment.apiUrl}/inscriptions`).subscribe({
      next: (data) => {
        this.inscriptionsEnCours = (data ?? []).filter(
          i => i.statut === 'NOUVELLE' || i.statut === 'EN_COURS'
        );
      },
      error: () => {},
    });
  }

  loadCommandesEnCours(): void {
    this.http.get<any[]>(`${environment.apiUrl}/commandes`).subscribe({
      next: (data) => {
        this.commandesEnCours = (data ?? []).filter(
          c => c.statut === 'EN_ATTENTE' || c.statut === 'EN_PREPARATION'
        );
      },
      error: () => {},
    });
  }

  marquerLivree(id: number): void {
    this.dashSvc.marquerInscriptionLivree(id).subscribe({
      next: () => {
        this.inscriptionsTraitees = this.inscriptionsTraitees.filter(d => d.id !== id);
        this.inscSuccess = "Inscription marquée livrée. L'admin sera notifié pour approuver le compte.";
        setTimeout(() => this.inscSuccess = '', 4000);
      },
      error: (err) => {
        this.inscError = err?.error?.message ?? 'Erreur lors de la livraison.';
        setTimeout(() => this.inscError = '', 4000);
      },
    });
  }

  loadCommandesRemboursement(): void {
    this.http.get<any[]>(`${environment.apiUrl}/commandes`).subscribe({
      next: (data) => {
        this.commandesRemboursement = (data ?? []).filter(
          c => c.statut === 'LIVREE' && c.optionRemise === 'REMBOURSEMENT' && !c.remboursementApprouve
        );
      },
      error: () => {},
    });
  }

  loadCommandesAConfirmer(): void {
    this.http.get<any[]>(`${environment.apiUrl}/commandes/a-confirmer`).subscribe({
      next: (data) => { this.commandesAConfirmer = data ?? []; },
      error: () => {},
    });
  }

  confirmerCommande(id: number): void {
    this.http.post<any>(`${environment.apiUrl}/commandes/${id}/confirmer`, {}).subscribe({
      next: (res) => {
        this.commandesAConfirmer = this.commandesAConfirmer.filter(c => c.id !== id);
        const label = res.typeConfirmation === 'RETOUR' ? 'retour confirmé' : 'livraison confirmée';
        this.navexSuccess = `Commande #${id} — ${label}. Commissions calculées.`;
        setTimeout(() => this.navexSuccess = '', 5000);
      },
      error: (err) => {
        this.navexError = err?.error?.message ?? 'Erreur lors de la confirmation.';
        setTimeout(() => this.navexError = '', 4000);
      },
    });
  }

  navexTrackingUrl(ref: string): string {
    return `https://app.navex.tn/expediteur/suivi.php?code=${ref}`;
  }

  approuverRemboursement(id: number): void {
    this.http.post(`${environment.apiUrl}/commandes/${id}/approuver-remboursement`, {}).subscribe({
      next: () => {
        this.commandesRemboursement = this.commandesRemboursement.filter(c => c.id !== id);
        this.rembSuccess = `Remboursement #${id} approuvé — solde crédité.`;
        setTimeout(() => this.rembSuccess = '', 4000);
      },
      error: (err) => {
        this.rembError = err?.error?.message ?? 'Erreur lors de l\'approbation.';
        setTimeout(() => this.rembError = '', 4000);
      },
    });
  }

  get kpis() { return this.state.kpis$.value; }
  get commissionsEnAttente() { return this.state.commissionsEnAttente; }
  get partenairesAvecSolde() { return this.state.partenairesAvecSolde; }
  get totalEnAttente() { return this.commissionsEnAttente.reduce((s, c) => s + c.montant, 0); }
  get totalAVirer() { return this.partenairesAvecSolde.reduce((s, p) => s + p.solde, 0); }

  goTo(path: string): void {
    this.router.navigate(['/comptable', path]);
  }

  masquerInfo = (info: string, type: string) => this.state.masquerInfo(info, type);
  paymentIcon  = (type: string) => this.state.paymentIcon(type);
  paymentColor = (type: string) => this.state.paymentColor(type);
}
