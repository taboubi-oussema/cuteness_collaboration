import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ComptableStateService } from '../../services/comptable-state.service';
import { Partenaire, Transaction, Virement } from '../../models/comptable.types';

@Component({
  selector: 'app-comptable-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comptable-transactions.html',
  styleUrls: ['../../dashboard/comptable-dashboard.css'],
})
export class ComptableTransactionsComponent implements OnInit {
  readonly state = inject(ComptableStateService);
  private route  = inject(ActivatedRoute);

  activeTab: 'transactions' | 'virements' = 'transactions';

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'virements') this.activeTab = 'virements';
  }

  // ── Transactions filters ──────────────────────────────────────────
  filtreType: 'TOUS' | 'PACK' | 'BOUTIQUE' = 'TOUS';
  filtreStatut: 'TOUS' | 'PAYEE' | 'EN_ATTENTE' | 'ANNULEE' = 'TOUS';

  get filtered(): Transaction[] {
    return this.state.transactions$.value.filter(t => {
      const typeOk = this.filtreType === 'TOUS' || t.type === this.filtreType;
      const statutOk = this.filtreStatut === 'TOUS' || t.statut === this.filtreStatut;
      return typeOk && statutOk;
    });
  }

  get totalBrut() { return this.filtered.reduce((s, t) => s + t.montant, 0); }
  get totalReduction() { return this.filtered.reduce((s, t) => s + t.reduction, 0); }
  get totalNet() { return this.filtered.reduce((s, t) => s + t.montantFinal, 0); }

  // ── Virements ────────────────────────────────────────────────────
  filtreVirement: 'TOUS' | 'EN_ATTENTE' | 'EFFECTUE' | 'ECHEC' = 'TOUS';
  dateVirement = this.getNextFriday();
  configSauvegardee = false;

  showModal = false;
  partenaireSelectionne: Partenaire | null = null;
  virementEnCours = false;
  virementTermine = false;

  get virementsFiltered(): Virement[] {
    const all = this.state.virements$.value;
    return this.filtreVirement === 'TOUS' ? all : all.filter(v => v.statut === this.filtreVirement);
  }

  get partenairesAvecSolde() { return this.state.partenairesAvecSolde; }
  get totalAVirer() { return this.partenairesAvecSolde.reduce((s, p) => s + p.solde, 0); }

  get formattedDate(): string {
    if (!this.dateVirement) return '';
    const d = new Date(this.dateVirement);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return d.toLocaleDateString('fr-FR', options);
  }

  private getNextFriday(): string {
    const today = new Date();
    const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7;
    const next = new Date(today);
    next.setDate(today.getDate() + daysUntilFriday);
    return next.toISOString().split('T')[0];
  }

  sauvegarderConfig(): void {
    this.state.saveDateVirement(this.dateVirement);
    this.configSauvegardee = true;
    setTimeout(() => (this.configSauvegardee = false), 3000);
  }

  ouvrirModal(p: Partenaire): void {
    this.partenaireSelectionne = p;
    this.showModal = true;
    this.virementTermine = false;
  }

  async confirmerVirement(): Promise<void> {
    if (!this.partenaireSelectionne) return;
    this.virementEnCours = true;
    const semaine = 'Semaine ' + this.state.getSemaine();
    const ok = await firstValueFrom(this.state.confirmerVirement(this.partenaireSelectionne, semaine));
    this.virementEnCours = false;
    if (ok) {
      this.virementTermine = true;
      this.partenaireSelectionne = null;
      setTimeout(() => { this.showModal = false; this.virementTermine = false; }, 2000);
    } else {
      alert('Erreur lors du virement. Veuillez réessayer.');
    }
  }

  async virerTout(): Promise<void> {
    const semaine = 'Semaine ' + this.state.getSemaine();
    let count = 0;
    for (const p of [...this.partenairesAvecSolde]) {
      const ok = await firstValueFrom(this.state.confirmerVirement(p, semaine));
      if (ok) count++;
    }
    alert(`${count} virement(s) effectué(s) avec succès !`);
  }

  masquerInfo = (info: string, type: string) => this.state.masquerInfo(info, type);
  paymentIcon = (type: string) => this.state.paymentIcon(type);
  paymentColor = (type: string) => this.state.paymentColor(type);

  virementStatutClass(statut: string): string {
    return statut === 'EFFECTUE' ? 'st-VALIDEE' : statut === 'ECHEC' ? 'st-REFUSEE' : 'st-EN_ATTENTE';
  }
}
