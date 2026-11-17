import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComptableStateService } from '../../../comptable/services/comptable-state.service';
import { Transaction } from '../../../comptable/models/comptable.types';

@Component({
  selector: 'app-admin-transactions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-transactions.html',
  styleUrls: ['../../dashboard/Dashboard.component.css', '../../../comptable/dashboard/comptable-dashboard.css'],
})
export class AdminTransactionsComponent {
  readonly state = inject(ComptableStateService);

  filtreType: 'TOUS' | 'PACK' | 'BOUTIQUE' = 'TOUS';
  filtreStatut: 'TOUS' | 'PAYEE' | 'EN_ATTENTE' | 'ANNULEE' = 'TOUS';

  get filtered(): Transaction[] {
    return this.state.transactions$.value.filter(t => {
      const typeOk = this.filtreType === 'TOUS' || t.type === this.filtreType;
      const statutOk = this.filtreStatut === 'TOUS' || t.statut === this.filtreStatut;
      return typeOk && statutOk;
    });
  }

  get totalBrut(): number { return this.filtered.reduce((s, t) => s + t.montant, 0); }
  get totalReduction(): number { return this.filtered.reduce((s, t) => s + t.reduction, 0); }
  get totalNet(): number { return this.filtered.reduce((s, t) => s + t.montantFinal, 0); }
}
