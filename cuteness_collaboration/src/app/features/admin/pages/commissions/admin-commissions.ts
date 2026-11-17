import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComptableStateService } from '../../../comptable/services/comptable-state.service';
import { Commission } from '../../../comptable/models/comptable.types';

@Component({
  selector: 'app-admin-commissions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-commissions.html',
  styleUrls: ['../../dashboard/Dashboard.component.css', '../../../comptable/dashboard/comptable-dashboard.css'],
})
export class AdminCommissionsComponent implements OnInit {
  readonly state = inject(ComptableStateService);

  filtre: 'TOUS' | 'EN_ATTENTE' | 'VALIDEE' | 'REFUSEE' = 'EN_ATTENTE';

  ngOnInit(): void {
    // Always reload from backend when this page is opened
    this.state.reload();
  }

  get commissionsFiltered(): Commission[] {
    const all = this.state.commissions$.value;
    if (this.filtre === 'TOUS') return all;
    if (this.filtre === 'VALIDEE') {
      // VALIDEE_ADMIN is the admin-validated state; VALIDEE is comptable-paid state
      return all.filter(c => c.statut === 'VALIDEE' || c.statut === 'VALIDEE_ADMIN');
    }
    return all.filter(c => c.statut === this.filtre);
  }

  get commissionsEnAttente(): Commission[] {
    return this.state.commissions$.value.filter(c => c.statut === 'EN_ATTENTE');
  }

  get commissionsValidees(): Commission[] {
    return this.state.commissions$.value.filter(c => c.statut === 'VALIDEE' || c.statut === 'VALIDEE_ADMIN');
  }

  get commissionsRefusees(): Commission[] {
    return this.state.commissions$.value.filter(c => c.statut === 'REFUSEE');
  }

  valider(id: string): void {
    this.state.validerCommission(id);
  }

  refuser(id: string): void {
    this.state.refuserCommission(id);
  }

  validerTout(): void {
    this.state.validerTout();
  }
}
