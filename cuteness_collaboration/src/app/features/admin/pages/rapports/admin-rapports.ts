import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComptableStateService } from '../../../comptable/services/comptable-state.service';

@Component({
  selector: 'app-admin-rapports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-rapports.html',
  styleUrls: ['../../dashboard/Dashboard.component.css', '../../../comptable/dashboard/comptable-dashboard.css'],
})
export class AdminRapportsComponent {
  readonly state = inject(ComptableStateService);

  periode = 'mars-2026';
  rapportGenere = false;

  get kpis() { return this.state.kpis$.value; }
  get totalEnAttente(): number {
    return this.state.commissionsEnAttente.reduce((s, c) => s + c.montant, 0);
  }

  exporterCSV(type: 'commissions' | 'transactions' | 'virements'): void {
    this.state.exporterCSV(type, this.periode);
  }

  exporterPDF(): void { window.print(); }

  genererRapport(): void {
    this.rapportGenere = true;
    setTimeout(() => (this.rapportGenere = false), 3000);
  }
}
