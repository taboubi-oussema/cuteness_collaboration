import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { ComptableStateService } from '../../services/comptable-state.service';
import { Commission } from '../../models/comptable.types';

@Component({
  selector: 'app-comptable-commissions',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './comptable-commissions.html',
  styleUrls: ['../../dashboard/comptable-dashboard.css'],
})
export class ComptableCommissionsComponent implements OnInit, OnDestroy {
  readonly state = inject(ComptableStateService);

  allCommissions: Commission[] = [];
  filtre: 'TOUS' | 'EN_ATTENTE' | 'VALIDEE_ADMIN' | 'VALIDEE' | 'REFUSEE' = 'EN_ATTENTE';
  payingId: string | null = null;
  deletingId: string | null = null;

  autoRefresh = false;
  lastRefresh: Date | null = null;
  private refreshInterval: any;
  private sub = new Subscription();

  ngOnInit(): void {
    this.sub = this.state.commissions$.subscribe(data => {
      this.allCommissions = data;
    });
    this.state.reload();
    this.lastRefresh = new Date();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;
    if (this.autoRefresh) {
      this.refreshInterval = setInterval(() => {
        this.state.reload();
        this.lastRefresh = new Date();
      }, 30000);
    } else {
      clearInterval(this.refreshInterval);
    }
  }

  refresh(): void {
    this.state.reload();
    this.lastRefresh = new Date();
  }

  get commissionsFiltered(): Commission[] {
    return this.filtre === 'TOUS' ? this.allCommissions : this.allCommissions.filter(c => c.statut === this.filtre);
  }

  get commissionsEnAttente(): Commission[] {
    return this.allCommissions.filter(c => c.statut === 'EN_ATTENTE');
  }

  get commissionsValideeAdmin(): Commission[] {
    return this.allCommissions.filter(c => c.statut === 'VALIDEE_ADMIN');
  }

  payer(id: string): void {
    if (this.payingId) return;
    this.payingId = id;
    this.state.payerCommission(id);
    setTimeout(() => { this.payingId = null; }, 2000);
  }

  supprimer(id: string): void {
    if (this.deletingId) return;
    this.deletingId = id;
    this.state.supprimerCommission(id);
    setTimeout(() => { this.deletingId = null; }, 1500);
  }

  crediterTout(): void {
    const ids = this.commissionsFiltered
      .filter(c => c.statut === 'EN_ATTENTE' || c.statut === 'VALIDEE_ADMIN')
      .map(c => c.id);
    ids.forEach((id, i) => setTimeout(() => this.state.payerCommission(id), i * 300));
  }

  statutLabel(statut: string): string {
    const labels: Record<string, string> = {
      EN_ATTENTE:    'En attente',
      VALIDEE_ADMIN: 'Pré-approuvée',
      VALIDEE:       'Créditée',
      REFUSEE:       'Refusée',
    };
    return labels[statut] ?? statut;
  }
}
