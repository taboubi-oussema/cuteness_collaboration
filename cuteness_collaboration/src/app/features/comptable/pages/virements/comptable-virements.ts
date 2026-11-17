import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComptableStateService } from '../../services/comptable-state.service';
import { Partenaire, Virement } from '../../models/comptable.types';

@Component({
  selector: 'app-comptable-virements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comptable-virements.html',
  styleUrls: ['../../dashboard/comptable-dashboard.css'],
})
export class ComptableVirementsComponent {
  readonly state = inject(ComptableStateService);

  filtre: 'TOUS' | 'EN_ATTENTE' | 'EFFECTUE' | 'ECHEC' = 'TOUS';
  dateVirement = this.getNextFriday();
  configSauvegardee = false;

  showModal = false;
  partenaireSelectionne: Partenaire | null = null;
  virementEnCours = false;
  virementTermine = false;

  get virementsFiltered(): Virement[] {
    const all = this.state.virements$.value;
    return this.filtre === 'TOUS' ? all : all.filter(v => v.statut === this.filtre);
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
    const dayOfWeek = today.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + daysUntilFriday);
    return nextFriday.toISOString().split('T')[0];
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
    const ok = await this.state.confirmerVirement(this.partenaireSelectionne, semaine);
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
      const ok = await this.state.confirmerVirement(p, semaine);
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
