import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface KpiCard {
  icon: string; iconBg: string;
  value: string; label: string;
  trend: string; pct: number;
  target: string; color: string;
}

interface Commande {
  id: string; partenaire: string; pack: string;
  montant: number; statut: string; date: string; region: string;
}

@Component({
  selector: 'app-superviseur-accueil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './superviseur-accueil.html',
  styleUrls: [
    '../../dashboard/superviseur-dashboard.css',
    './superviseur-accueil.css',
  ],
})
export class SuperviseurAccueilComponent implements OnInit {
  private http = inject(HttpClient);

  isLoading = true;
  errorMsg = '';

  stats = {
    commandesEnAttente: 0,
    commandesEnPreparation: 0,
    commandesLivrees: 0,
    partenaires: 0,
    signalements: 0,
    newThisMonth: 0,
  };

  kpiCards: KpiCard[] = [
    { icon: '📦', iconBg: '#FFF0EE', value: '0', label: 'Commandes en attente',
      trend: '⏳ À traiter', pct: 0, target: 'priorité haute', color: '#FF6B5B' },
    { icon: '🔧', iconBg: '#EEF8FF', value: '0', label: 'En préparation',
      trend: '🔄 En cours', pct: 0, target: 'en traitement', color: '#3AAFDA' },
    { icon: '✅', iconBg: '#EDFAF4', value: '0', label: 'Livrées ce mois',
      trend: '↑ Bon rythme', pct: 0, target: 'objectif 100', color: '#4ECBA0' },
    { icon: '⚠️', iconBg: '#FFFBE8', value: '0', label: 'Signalements actifs',
      trend: '🔔 À traiter', pct: 0, target: 'à escalader', color: '#F59E0B' },
  ];

  recentCommandes: Commande[] = [];
  tachesJour: { icon: string; text: string; done: boolean }[] = [
    { icon: '📦', text: 'Vérifier les nouvelles commandes en attente', done: false },
    { icon: '🔧', text: 'Mettre à jour le statut des commandes en préparation', done: false },
    { icon: '📋', text: 'Consulter les rapports du jour', done: false },
    { icon: '⚠️', text: 'Traiter les signalements reçus', done: false },
    { icon: '📞', text: 'Contacter les partenaires avec commandes bloquées', done: false },
  ];

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.http.get<Record<string, unknown>>(`${environment.apiUrl}/dashboard/admin`).subscribe({
      next: (data) => {
        this.stats.partenaires = Number(data?.['totalPartenaires'] ?? 0);
        this.stats.commandesEnAttente = Number(data?.['commandesEnAttente'] ?? 0);
        this.stats.signalements = Number(data?.['signalements'] ?? 0);
        this.stats.newThisMonth = Number(data?.['newThisMonth'] ?? 0);

        this.kpiCards[0].value = String(this.stats.commandesEnAttente);
        this.kpiCards[0].pct = Math.min(100, this.stats.commandesEnAttente * 5);
        this.kpiCards[3].value = String(this.stats.signalements);
        this.kpiCards[3].pct = Math.min(100, this.stats.signalements * 10);

        this.isLoading = false;
      },
      error: () => {
        this.errorMsg = 'Impossible de charger les données.';
        this.isLoading = false;
      },
    });

    this.http.get<any[]>(`${environment.apiUrl}/commandes`).subscribe({
      next: (data) => {
        const all: Commande[] = (data ?? []).map((c: any) => ({
          id: String(c.id ?? ''),
          partenaire: c.nomPartenaire ?? c.partenaire ?? 'Inconnu',
          pack: c.nomPack ?? c.pack ?? '',
          montant: Number(c.montantTotal ?? c.montant ?? 0),
          statut: c.statut ?? 'EN_ATTENTE',
          date: c.dateCommande ? new Date(c.dateCommande).toLocaleDateString('fr-FR') : '',
          region: c.regionPartenaire ?? c.region ?? '',
        }));
        this.stats.commandesEnPreparation = all.filter(c => c.statut === 'EN_PREPARATION').length;
        this.stats.commandesLivrees = all.filter(c => c.statut === 'LIVREE').length;
        this.kpiCards[1].value = String(this.stats.commandesEnPreparation);
        this.kpiCards[2].value = String(this.stats.commandesLivrees);
        this.kpiCards[2].pct = Math.min(100, Math.round((this.stats.commandesLivrees / 100) * 100));
        this.recentCommandes = all
          .filter(c => c.statut === 'EN_ATTENTE' || c.statut === 'EN_PREPARATION')
          .slice(0, 6);
      },
      error: () => {},
    });
  }

  statutColor(s: string): string {
    return s === 'LIVREE' ? 'st-VALIDEE'
      : s === 'EN_PREPARATION' ? 'st-blue'
      : s === 'ANNULEE' ? 'st-REFUSEE'
      : 'st-EN_ATTENTE';
  }

  toggleTache(i: number): void {
    this.tachesJour[i].done = !this.tachesJour[i].done;
  }
}
