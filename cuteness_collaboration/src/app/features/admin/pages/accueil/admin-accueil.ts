import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../../../core/services/dashboard.service';

interface Stats {
  totalPartners: number;
  monthCommissions: number;
  deliveryRate: number;
  pendingCommissions: number;
  newThisMonth: number;
  notifications: number;
  reports: number;
}

interface KpiCard {
  icon: string;
  iconBg: string;
  trend: string;
  trendColor: string;
  value: string;
  label: string;
  pct: number;
  target: string;
  color: string;
}

interface Partner {
  name: string;
  initials: string;
  city: string;
  referrals: number;
  balance: number;
  level: string;
  levelBg: string;
  levelColor: string;
  avaBg: string;
  avaColor: string;
  rankColor: string;
  spark: string;
  sparkColor: string;
  status: string;
  statusBg: string;
  statusColor: string;
}

interface Activity {
  icon: string;
  iconBg: string;
  title: string;
  meta: string;
  amount: string;
  amountColor: string;
}

interface Objective {
  label: string;
  current: string;
  target: string;
  pct: number;
  color: string;
}

interface Region {
  flag: string;
  name: string;
  count: number;
  pct: number;
  pctLabel: string;
  color: string;
}

interface MlmLevel {
  name: string;
  count: number;
  color: string;
}

interface Chip {
  key: string;
  label: string;
}

@Component({
  selector: 'app-admin-accueil',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  templateUrl: './admin-accueil.html',
  styleUrls: ['../../dashboard/Dashboard.component.css', '../../../comptable/dashboard/comptable-dashboard.css'],
})
export class AdminAccueilComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  today = new Date();
  activeSoldesChip = 'partenaire-0';
  partnerFilter: 'month' | 'all' = 'month';

  isLoading = true;
  errorMsg = '';

  stats: Stats = {
    totalPartners: 0,
    monthCommissions: 0,
    deliveryRate: 97,
    pendingCommissions: 0,
    newThisMonth: 0,
    notifications: 0,
    reports: 0,
  };

  kpiCards: KpiCard[] = [
    {
      icon: '🤝', iconBg: '#EEF8FF',
      trend: '↑ +12%', trendColor: '#3AAFDA',
      value: '248', label: 'Partenaires actifs',
      pct: 72, target: 'sur 345', color: '#FF6B5B',
    },
    {
      icon: '💰', iconBg: '#FFF0EE',
      trend: '↑ +8%', trendColor: '#FF6B5B',
      value: '4 712 DT', label: 'Commissions ce mois',
      pct: 58, target: 'sur 8 000 DT', color: '#FF6B5B',
    },
    {
      icon: '📦', iconBg: '#EDFAF4',
      trend: '↑ +24%', trendColor: '#4ECBA0',
      value: '1 236', label: 'Commandes ce mois',
      pct: 85, target: 'sur 1 450', color: '#4ECBA0',
    },
    {
      icon: '📊', iconBg: '#FFF0EE',
      trend: '↓ -3%', trendColor: '#FF6B5B',
      value: '18 540 DT', label: "Chiffre d'affaires",
      pct: 62, target: 'sur 30 000 DT', color: '#3AAFDA',
    },
  ];

  partnerChips: Chip[] = [];
  topPartners: Partner[] = [];
  mlmLevels: MlmLevel[] = [];
  recentActivity: Activity[] = [];

  objectives: Objective[] = [
    { label: "💰 Chiffre d'affaires", current: '18 540', target: '30 000 DT', pct: 62, color: '#FF6B5B' },
    { label: '👥 Nouveaux partenaires', current: '25', target: '30', pct: 83, color: '#3AAFDA' },
    { label: '📦 Commandes livrées', current: '1 236', target: '1 450', pct: 85, color: '#4ECBA0' },
    { label: '⭐ Montées Gold+', current: '9', target: '20', pct: 45, color: '#FFD166' },
    { label: '💸 Commissions versées', current: '3 420', target: '8 000 DT', pct: 43, color: '#FFB3C6' },
  ];

  regions: Region[] = [
    { flag: '🏙️', name: 'Grand Tunis', count: 82, pct: 100, pctLabel: '33%', color: '#FF6B5B' },
    { flag: '🌊', name: 'Sfax', count: 47, pct: 57, pctLabel: '19%', color: '#3AAFDA' },
    { flag: '🌿', name: 'Sousse', count: 37, pct: 45, pctLabel: '15%', color: '#4ECBA0' },
    { flag: '🌸', name: 'Monastir', count: 30, pct: 37, pctLabel: '12%', color: '#FFD166' },
    { flag: '🏖️', name: 'Nabeul', count: 22, pct: 27, pctLabel: '9%', color: '#FFB3C6' },
  ];

  comptesEnAttente: any[] = [];
  compteSuccess = '';
  compteError   = '';
  activatingId: number | null = null;

  ngOnInit(): void {
    this.loadDashboard();
    this.loadComptesEnAttente();
  }

  loadComptesEnAttente(): void {
    this.dashboardService.getComptesEnAttente().subscribe({
      next: (data) => { this.comptesEnAttente = data ?? []; },
      error: () => {},
    });
  }

  approuverCompte(id: number, nom: string): void {
    if (this.activatingId !== null) return;
    this.activatingId = id;
    this.dashboardService.approuverCompte(id).subscribe({
      next: () => {
        this.comptesEnAttente = this.comptesEnAttente.filter(c => c.id !== id);
        this.compteSuccess = `Compte de ${nom} activé. Le partenaire peut maintenant se connecter.`;
        this.activatingId = null;
        setTimeout(() => this.compteSuccess = '', 4000);
      },
      error: () => {
        this.activatingId = null;
        this.compteError = 'Erreur lors de l\'activation. Vérifiez que le compte existe.';
        setTimeout(() => this.compteError = '', 4000);
      },
    });
  }

  rejeterCompte(id: number, nom: string): void {
    this.dashboardService.rejeterCompte(id).subscribe({
      next: () => {
        this.comptesEnAttente = this.comptesEnAttente.filter(c => c.id !== id);
        this.compteSuccess = `Demande de ${nom} refusée.`;
        setTimeout(() => this.compteSuccess = '', 3000);
      },
      error: () => { this.compteError = 'Erreur lors du refus.'; setTimeout(() => this.compteError = '', 3000); },
    });
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.errorMsg = '';

    this.dashboardService.getAdminDashboard().subscribe({
      next: (data) => {
        const totalPartenaires = Number(data.totalPartenaires ?? 0);
        const totalCommissions = Number(data.totalCommissions ?? 0);
        const totalCommandes = Number(data.totalCommandes ?? 0);
        const chiffreAffaires = Number(data.chiffreAffaires ?? 0);
        const commandesEnAttente = Number(data.commandesEnAttente ?? 0);
        const newThisMonth = Number(data.newThisMonth ?? 0);

        this.stats.totalPartners = totalPartenaires;
        this.stats.monthCommissions = totalCommissions;
        this.stats.pendingCommissions = commandesEnAttente;
        this.stats.newThisMonth = newThisMonth;

        this.kpiCards[0].value = String(totalPartenaires);
        this.kpiCards[0].pct = totalPartenaires ? Math.round((totalPartenaires / 300) * 100) : 0;
        this.kpiCards[0].target = `sur ${Math.round(totalPartenaires * 1.3)}`;

        this.kpiCards[1].value = `${totalCommissions.toLocaleString('fr-FR')} DT`;
        this.kpiCards[1].pct = totalCommandes ? Math.round((totalCommandes / 500) * 100) : 0;
        this.kpiCards[1].target = `sur ${Math.round(totalCommandes * 1.5)} DT`;

        this.kpiCards[2].value = String(totalCommandes);
        this.kpiCards[2].pct = totalCommandes ? Math.round((totalCommandes / 200) * 100) : 0;
        this.kpiCards[2].target = `sur ${Math.round(totalCommandes * 1.3)}`;

        this.kpiCards[3].value = `${chiffreAffaires.toLocaleString('fr-FR')} DT`;

        const topPartenaires = data.topPartenaires as Record<string, unknown>[] | undefined;
        if (topPartenaires && topPartenaires.length > 0) {
          this.topPartners = topPartenaires.map((p: Record<string, unknown>) => {
            const style = this.getPackStyle(String(p['pack'] ?? ''));
            const nomStr = String(p['nom'] ?? '??');
            const initials = nomStr
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .substring(0, 2);
            return {
              name: nomStr,
              initials,
              city: 'Tunis',
              referrals: Number(p['filleuls'] ?? 0),
              balance: Number(p['solde'] ?? 0),
              level: `${style.emoji} ${String(p['pack'] ?? 'Starter')}`,
              levelBg: style.bg,
              levelColor: style.color,
              avaBg: style.bg,
              avaColor: style.color,
              rankColor: style.color,
              spark: this.generateSparkline(),
              sparkColor: style.color,
              status: p['actif'] ? '✅ Actif' : '⏳ Inactif',
              statusBg: p['actif'] ? '#EDFAF4' : '#FFFBE8',
              statusColor: p['actif'] ? '#4ECBA0' : '#B8860B',
            };
          });

          this.partnerChips = this.topPartners.map((p: Partner, idx: number) => ({
            key: `partenaire-${idx}`,
            label: `● ${p.name}`,
          }));

          if (this.partnerChips.length > 0) {
            this.activeSoldesChip = this.partnerChips[0].key;
          }
        }

        const mlmParPack = data.mlmParPack as Record<string, number> | undefined;
        if (mlmParPack) {
          const packOrder = ['Gold', 'Platine', 'Silver', 'Bronze', 'Starter'];
          const packColors: Record<string, string> = {
            Gold: '#FF6B5B', Platine: '#3AAFDA', Silver: '#4ECBA0', Bronze: '#FFD166', Starter: '#FFB3C6',
          };
          this.mlmLevels = packOrder
            .filter(pack => mlmParPack[pack])
            .map(pack => ({
              name: pack,
              count: mlmParPack[pack],
              color: packColors[pack] || '#8A92B2',
            }));
        }

        const activiteRecente = data.activiteRecente as Record<string, unknown>[] | undefined;
        if (activiteRecente && activiteRecente.length > 0) {
          this.recentActivity = activiteRecente.map((a: Record<string, unknown>) => {
            const actInfo = this.getActivityIcon(String(a['type'] ?? ''));
            const isPositive = a['type'] === 'CREDIT' || a['type'] === 'COMMISSION';
            const dateVal = a['date'] ? new Date(String(a['date'])).toLocaleDateString('fr-FR') : '';
            return {
              icon: actInfo.icon,
              iconBg: actInfo.iconBg,
              title: actInfo.title,
              meta: `${String(a['partenaire'] ?? 'Inconnu')} · ${dateVal}`,
              amount: `${isPositive ? '+' : ''}${String(a['montant'] ?? 0)} DT`,
              amountColor: isPositive ? '#4ECBA0' : '#3AAFDA',
            };
          });
        }

        this.isLoading = false;
      },
      error: () => {
        this.errorMsg = 'Erreur lors du chargement des données. Veuillez réessayer.';
        this.isLoading = false;
      },
    });
  }

  private getPackStyle(pack: string): { bg: string; color: string; emoji: string } {
    const PACK_COLORS: Record<string, { bg: string; color: string; emoji: string }> = {
      Gold:    { bg: '#FFF0EE', color: '#FF6B5B', emoji: '⭐' },
      Platine: { bg: '#EEF8FF', color: '#3AAFDA', emoji: '💎' },
      Silver:  { bg: '#EDFAF4', color: '#4ECBA0', emoji: '🌟' },
      Bronze:  { bg: '#FFFBE8', color: '#B8860B', emoji: '🥉' },
      Starter: { bg: '#FFF0F5', color: '#FF6B9D', emoji: '🥉' },
    };
    return PACK_COLORS[pack] ?? PACK_COLORS['Starter'];
  }

  private getActivityIcon(type: string): { icon: string; iconBg: string; title: string } {
    switch (type) {
      case 'COMMISSION': return { icon: '💸', iconBg: '#FFFBE8', title: 'Commission reçue' };
      case 'ACHAT':      return { icon: '🛍️', iconBg: '#FFF0EE', title: 'Nouvelle commande' };
      case 'CREDIT':     return { icon: '💰', iconBg: '#EEF8FF', title: 'Crédit effectué' };
      default:           return { icon: '📋', iconBg: '#F0F0F0', title: 'Transaction' };
    }
  }

  private generateSparkline(): string {
    const points = [];
    for (let i = 0; i < 7; i++) {
      const x = i * 9;
      const y = 18 - Math.random() * 15;
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  }

  filterSoldes(key: string): void {
    this.activeSoldesChip = key;
  }

  getOpacity(key: string): number {
    return this.activeSoldesChip === key ? 1 : 0.1;
  }

  getWidth(key: string): number {
    return this.activeSoldesChip === key ? 3 : 2;
  }

  exportCsv(): void {
    const rows = [
      ['Partenaire', 'Ville', 'Solde (DT)', 'Niveau', 'Filleuls'],
      ...this.topPartners.map(p => [p.name, p.city, p.balance, p.level, p.referrals]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'partenaires-cuteness.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
