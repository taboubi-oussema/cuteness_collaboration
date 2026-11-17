import { Injectable, inject }                        from '@angular/core';
import { BehaviorSubject, Observable, of }            from 'rxjs';
import { catchError, map }                            from 'rxjs/operators';
import { DashboardService }                           from '../../../core/services/dashboard.service';
import { DashboardSharedService }                     from '../../../core/services/dashboard-shared.service';
import { ComptableDashboardResponse, PartenaireDto, CommissionDto, TransactionDto, VirementDto }  from '../../../shared/models/dashboard.model';
import {
  BiData,
  Commission,
  KPIs,
  NoeudReseau,
  Partenaire,
  Transaction,
  Virement,
} from '../models/comptable.types';

const DEFAULT_KPIS: KPIs = {
  totalCommissionsValidees: 0,
  totalTransactionsPacks: 0,
  totalTransactionsBoutique: 0,
  commissionsAValider: 0,
  totalPartenaires: 0,
  revenusMonth: 0,
  totalAVirer: 0,
  virementsSemaine: 0,
};

const DEFAULT_RESEAU: NoeudReseau = {
  id: 'root',
  nom: 'Cuteness Collaboration',
  pack: '',
  niveau: 0,
  actif: true,
  solde: 0,
  filleuls: [],
};

@Injectable({ providedIn: 'root' })
export class ComptableStateService {
  private readonly _dashSvc  = inject(DashboardService);
  private readonly _shared   = inject(DashboardSharedService);

  private _loaded = false;

  isLoading$ = new BehaviorSubject<boolean>(false);
  error$ = new BehaviorSubject<string>('');
  kpis$ = new BehaviorSubject<KPIs>({ ...DEFAULT_KPIS });
  commissions$ = new BehaviorSubject<Commission[]>([]);
  transactions$ = new BehaviorSubject<Transaction[]>([]);
  partenaires$ = new BehaviorSubject<Partenaire[]>([]);
  virements$ = new BehaviorSubject<Virement[]>([]);
  reseau$ = new BehaviorSubject<NoeudReseau>({ ...DEFAULT_RESEAU });
  dateVirement$ = new BehaviorSubject<string>(this.getStoredDateVirement());
  biData$ = new BehaviorSubject<BiData | null>(null);

  private getStoredDateVirement(): string {
    return localStorage.getItem('dateVirement') || this.getDefaultDateVirement();
  }

  private getDefaultDateVirement(): string {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + daysUntilFriday);
    return nextFriday.toISOString().split('T')[0];
  }

  saveDateVirement(date: string): void {
    this.dateVirement$.next(date);
    localStorage.setItem('dateVirement', date);
  }

  getDateVirementFormatted(): string {
    const dateStr = this.dateVirement$.value;
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  // ── Load ────────────────────────────────────────────────────────────

  load(force = false): void {
    if (this._loaded && !force) return;
    this.isLoading$.next(true);
    this.error$.next('');

    this._dashSvc.getComptableDashboard().pipe(
      catchError(() => {
        this.error$.next('Impossible de charger les données du dashboard comptable.');
        this.isLoading$.next(false);
        return of(null);
      })
    ).subscribe((data: ComptableDashboardResponse | null) => {
      if (!data) return;

      const apiKpis = data.kpis;
      this.kpis$.next({
        totalCommissionsValidees:  Number(apiKpis?.totalCommissionsValidees  ?? 0),
        totalTransactionsPacks:    Number(apiKpis?.totalTransactionsPacks    ?? 0),
        totalTransactionsBoutique: Number(apiKpis?.totalTransactionsBoutique ?? 0),
        commissionsAValider:       Number(apiKpis?.commissionsAValider       ?? 0),
        totalPartenaires:          Number(apiKpis?.totalPartenaires          ?? 0),
        revenusMonth:              Number(apiKpis?.revenusMonth              ?? 0),
        totalAVirer:               Number(apiKpis?.totalAVirer               ?? 0),
        virementsSemaine:          Number(apiKpis?.virementsSemaine          ?? 0),
      });

      const commissions = (data.commissions  ?? []).map(c => this.mapCommission(c));
      const transactions = (data.transactions ?? []).map(t => this.mapTransaction(t));
      const partenaires  = (data.partenaires  ?? []).map(p => this.mapPartenaire(p));
      const virements    = (data.virements    ?? []).map(v => this.mapVirement(v));

      this.commissions$.next(commissions);
      this.transactions$.next(transactions);
      this.partenaires$.next(partenaires);
      this.virements$.next(virements);
      this.buildReseau(partenaires);
      this.loadReseau();
      this.biData$.next(this.buildBiData());

      this._loaded = true;
      this.isLoading$.next(false);
    });
  }

  reload(): void {
    this._loaded = false;
    this.load();
  }

  // ── Actions ─────────────────────────────────────────────────────────

  validerCommission(id: string): void {
    const numericId = parseInt(id.substring(1), 10);
    this._dashSvc.validerCommission(numericId).subscribe({
      next: () => {
        const updated = this.commissions$.value.map(c =>
          c.id === id ? { ...c, statut: 'VALIDEE_ADMIN' as any } : c
        );
        this.commissions$.next(updated);
        const kpis = this.kpis$.value;
        this.kpis$.next({ ...kpis, commissionsAValider: Math.max(0, kpis.commissionsAValider - 1) });
        this.biData$.next(this.buildBiData());
      },
      error: () => { this.error$.next('Erreur lors de la validation de la commission.'); },
    });
  }

  payerCommission(id: string): void {
    const numericId = parseInt(id.substring(1), 10);
    const commission = this.commissions$.value.find(c => c.id === id);
    this._dashSvc.payerCommission(numericId).subscribe({
      next: () => {
        // 1. Mettre à jour le statut de la commission
        this.commissions$.next(
          this.commissions$.value.map(c => c.id === id ? { ...c, statut: 'VALIDEE' as any } : c)
        );
        // 2. Mettre à jour le solde du partenaire dans partenaires$
        if (commission) {
          const montant = commission.montant;
          const nomPartenaire = commission.partenaire;
          this.partenaires$.next(
            this.partenaires$.value.map(p =>
              p.nom === nomPartenaire ? { ...p, solde: p.solde + montant } : p
            )
          );
          // 3. Mettre à jour le KPI totalAVirer
          const kpis = this.kpis$.value;
          this.kpis$.next({
            ...kpis,
            totalAVirer: kpis.totalAVirer + montant,
            commissionsAValider: Math.max(0, kpis.commissionsAValider - 1),
          });
        }
        this.biData$.next(this.buildBiData());
      },
      error: () => {
        this.error$.next('Erreur lors du créditage de la commission.');
      },
    });
  }

  supprimerCommission(id: string): void {
    const numericId = parseInt(id.substring(1), 10);
    this._dashSvc.supprimerCommission(numericId).subscribe({
      next: () => {
        this.commissions$.next(this.commissions$.value.filter(c => c.id !== id));
      },
      error: () => { this.error$.next('Erreur lors de la suppression de la commission.'); },
    });
  }

  refuserCommission(id: string): void {
    const numericId = parseInt(id.substring(1), 10);
    this._dashSvc.refuserCommission(numericId).subscribe({
      next: () => {
        const updated = this.commissions$.value.map(c =>
          c.id === id ? { ...c, statut: 'REFUSEE' as any } : c
        );
        this.commissions$.next(updated);
        const kpis = this.kpis$.value;
        this.kpis$.next({ ...kpis, commissionsAValider: Math.max(0, kpis.commissionsAValider - 1) });
        this.biData$.next(this.buildBiData());
      },
      error: () => { this.error$.next('Erreur lors du refus de la commission.'); },
    });
  }

  validerTout(): void {
    this._dashSvc.validerToutAdmin().subscribe({
      next: () => {
        const list = this.commissions$.value.map((c) =>
          c.statut === 'EN_ATTENTE' ? { ...c, statut: 'VALIDEE_ADMIN' as any } : c,
        );
        this.commissions$.next(list);
        this.kpis$.next({ ...this.kpis$.value, commissionsAValider: 0 });
        this.biData$.next(this.buildBiData());
      },
      error: () => {
        this.error$.next('Erreur lors de la validation en masse.');
      },
    });
  }

  /**
   * Confirms a virement for a partner.
   * Returns an Observable<boolean> — true on success, false on failure.
   */
  confirmerVirement(partenaire: Partenaire, semaine: string): Observable<boolean> {
    const infoBancaire = this.masquerInfo(partenaire.infoBancaire, partenaire.typePayment);
    return this._dashSvc
      .confirmerVirement(partenaire.userId ?? 0, partenaire.solde, infoBancaire, partenaire.typePayment, semaine)
      .pipe(
        map(response => {
          if (!response.success) return false;
          const virement: Virement = {
            id:           response.virement.id,
            partenaire:   partenaire.nom,
            montant:      partenaire.solde,
            infoBancaire,
            typePayment:  partenaire.typePayment,
            statut:       'EFFECTUE',
            date:         new Date().toLocaleDateString('fr-FR'),
            semaine,
          };
          this.virements$.next([virement, ...this.virements$.value]);
          this.partenaires$.next(
            this.partenaires$.value.map(p => p.id === partenaire.id ? { ...p, solde: 0 } : p)
          );
          return true;
        }),
        catchError(() => of(false))
      );
  }

  // ── Computed helpers ────────────────────────────────────────────────

  get commissionsEnAttente(): Commission[] {
    return this.commissions$.value.filter((c) => c.statut === 'EN_ATTENTE');
  }

  get partenairesAvecSolde(): Partenaire[] {
    return this.partenaires$.value.filter((p) => p.solde > 0);
  }

  // ── BI computations ─────────────────────────────────────────────────

  buildBiData(): BiData {
    return {
      revenusHebdo: this.computeRevenusHebdo(6),
      repartitionPacks: this.computeRepartitionPacks(),
      topPartenaires: this.computeTopPartenaires(5),
      commissionsStats: this.computeCommissionsStats(6),
    };
  }

  private computeRevenusHebdo(weeks: number): Array<{ semaine: string; montant: number }> {
    const revenueByWeek = new Map<string, number>();
    this.transactions$.value.forEach((t) => {
      const date = this._shared.parseDate(t.date);
      if (!date) return;
      const weekKey = this._shared.getWeekKey(date);
      revenueByWeek.set(weekKey, (revenueByWeek.get(weekKey) ?? 0) + t.montant);
    });
    const currentWeek = this._shared.getWeekKey(new Date());
    const [currentYear, currentWeekNumber] = currentWeek.split('-W').map(Number);
    const result: Array<{ semaine: string; montant: number }> = [];
    for (let i = weeks - 1; i >= 0; i--) {
      let weekNumber = currentWeekNumber - i;
      let year = currentYear;
      if (weekNumber <= 0) { year -= 1; weekNumber = 52 + weekNumber; }
      const key = `${year}-W${weekNumber}`;
      result.push({ semaine: `S${String(weekNumber).padStart(2, '0')}`, montant: Number((revenueByWeek.get(key) ?? 0).toFixed(2)) });
    }
    return result;
  }

  private computeRepartitionPacks(): Array<{ pack: string; count: number; pourcentage: number; color: string }> {
    const totalPartenaires = this.partenaires$.value.length || 1;
    const packCounts = new Map<string, number>();
    this.partenaires$.value.forEach((p) => {
      const pack = p.pack || 'Aucun';
      packCounts.set(pack, (packCounts.get(pack) ?? 0) + 1);
    });
    const colors = ['#00C9A7', '#3AAFD9', '#F59E0B', '#A78BFA', '#F97316'];
    let colorIndex = 0;
    return Array.from(packCounts.entries())
      .map(([pack, count]) => ({ pack, count, pourcentage: Number(((count / totalPartenaires) * 100).toFixed(0)), color: colors[colorIndex++ % colors.length] }))
      .sort((a, b) => b.count - a.count);
  }

  private computeTopPartenaires(limit: number): Array<{ nom: string; gains: number; pack: string }> {
    return this.partenaires$.value
      .map((p) => ({ nom: p.nom, gains: p.totalGains ?? 0, pack: p.pack || 'Aucun' }))
      .sort((a, b) => b.gains - a.gains)
      .slice(0, limit);
  }

  private computeCommissionsStats(weeks: number): Array<{ semaine: string; validees: number; refusees: number }> {
    const stats = new Map<string, { validees: number; refusees: number }>();
    this.commissions$.value.forEach((c) => {
      const date = this._shared.parseDate(c.date);
      if (!date) return;
      const weekKey = this._shared.getWeekKey(date);
      const current = stats.get(weekKey) ?? { validees: 0, refusees: 0 };
      if (c.statut === 'VALIDEE' || c.statut === 'VALIDEE_ADMIN') current.validees += 1;
      if (c.statut === 'REFUSEE') current.refusees += 1;
      stats.set(weekKey, current);
    });
    const currentWeek = this._shared.getWeekKey(new Date());
    const [currentYear, currentWeekNumber] = currentWeek.split('-W').map(Number);
    const result: Array<{ semaine: string; validees: number; refusees: number }> = [];
    for (let i = weeks - 1; i >= 0; i--) {
      let weekNumber = currentWeekNumber - i;
      let year = currentYear;
      if (weekNumber <= 0) { year -= 1; weekNumber = 52 + weekNumber; }
      const key = `${year}-W${weekNumber}`;
      const row = stats.get(key) ?? { validees: 0, refusees: 0 };
      result.push({ semaine: `S${String(weekNumber).padStart(2, '0')}`, validees: row.validees, refusees: row.refusees });
    }
    return result;
  }

  // ── Utility ─────────────────────────────────────────────────────────

  masquerInfo(info: string, type: string): string {
    if (type === 'CARTE') return info.substring(0, 4) + ' **** **** ' + info.slice(-4);
    if (type === 'RIB') return info.substring(0, 8) + ' **** **** ' + info.slice(-4);
    if (type === 'EDINAR') {
      const parts = info.split('-');
      return parts[0] + '-' + parts[1] + '-****-' + parts[3];
    }
    return info;
  }

  paymentIcon(type: string): string {
    return type === 'CARTE' ? 'fas fa-credit-card' : type === 'RIB' ? 'fas fa-university' : 'fas fa-wallet';
  }

  paymentColor(type: string): string {
    return type === 'CARTE' ? 'pm-carte' : type === 'RIB' ? 'pm-rib' : 'pm-edinar';
  }

  getSemaine(): number {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  }

  /**
   * Exports the selected data type as a CSV file.
   * Delegates browser DOM work to DashboardSharedService (SSR-safe).
   */
  exporterCSV(type: 'commissions' | 'transactions' | 'virements', periode: string): void {
    const configs = {
      commissions: {
        headers:  ['ID', 'Partenaire', 'Source', 'Montant (DT)', 'Niveau', 'Pack', 'Statut', 'Date'],
        rows:     this.commissions$.value.map(c  => [c.id, c.partenaire, c.source, c.montant, c.niveau, c.pack, c.statut, c.date]),
        filename: `commissions-${periode}.csv`,
      },
      transactions: {
        headers:  ['ID', 'Partenaire', 'Type', 'Description', 'Montant', 'Réduction', 'Net', 'Statut', 'Date'],
        rows:     this.transactions$.value.map(t => [t.id, t.partenaire, t.type, t.description, t.montant, t.reduction, t.montantFinal, t.statut, t.date]),
        filename: `transactions-${periode}.csv`,
      },
      virements: {
        headers:  ['ID', 'Partenaire', 'Montant', 'Type Payment', 'Statut', 'Date', 'Semaine'],
        rows:     this.virements$.value.map(v  => [v.id, v.partenaire, v.montant, v.typePayment, v.statut, v.date, v.semaine]),
        filename: `virements-${periode}.csv`,
      },
    };
    const { filename, headers, rows } = configs[type];
    this._shared.downloadCsv(filename, headers, rows as (string | number)[][]);
  }

  // ── Month helpers (public for BI components) ─────────────────────────

  private getMonthKey(date: Date | null): string {
    if (!date) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  getLastNMonthKeys(n: number): string[] {
    const result: string[] = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push(this.getMonthKey(d));
    }
    return result;
  }

  getMonthLabel(key: string): string {
    if (!key) return '';
    const [year, month] = key.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
  }

  computePartnerMonthlyGains(months: number): Array<{ nom: string; color: string; monthlyGains: number[] }> {
    const topPartners = this.partenaires$.value
      .map(p => ({ nom: p.nom, gains: p.totalGains ?? 0 }))
      .sort((a, b) => b.gains - a.gains)
      .slice(0, 5);
    const colors = ['#FF6B5B', '#3AAFDA', '#4ECBA0', '#FFD166', '#FFB3C6'];
    const monthKeys = this.getLastNMonthKeys(months);

    return topPartners.map((p, i) => {
      let cumulative = 0;
      const monthlyGains = monthKeys.map(key => {
        const gained = this.commissions$.value
          .filter(c =>
            c.partenaire === p.nom &&
            (c.statut === 'VALIDEE' || c.statut === 'VALIDEE_ADMIN') &&
            this.getMonthKey(this._shared.parseDate(c.date)) === key
          )
          .reduce((sum, c) => sum + c.montant, 0);
        cumulative += gained;
        return cumulative;
      });
      return { nom: p.nom, color: colors[i % colors.length], monthlyGains };
    });
  }

  computeNetworkGrowthMonthly(months: number): Array<{ label: string; count: number }> {
    const monthKeys = this.getLastNMonthKeys(months);
    const firstSeen = new Map<string, string>();
    this.transactions$.value.forEach(t => {
      const key = this.getMonthKey(this._shared.parseDate(t.date));
      if (!key) return;
      const existing = firstSeen.get(t.partenaire);
      if (!existing || key < existing) firstSeen.set(t.partenaire, key);
    });
    return monthKeys.map(key => ({
      label: this.getMonthLabel(key),
      count: Array.from(firstSeen.values()).filter(v => v === key).length,
    }));
  }

  // ── Private mappers ──────────────────────────────────────────────────

  private loadReseau(): void {
    this._dashSvc.getFullNetworkTree().pipe(
      catchError(() => of(null))
    ).subscribe(data => {
      if (data) this.reseau$.next(this.mapReseauNode(data));
    });
  }

  private buildReseau(partenaires: Partenaire[]): void {
    const nodesById = new Map<string, NoeudReseau>();
    partenaires.forEach((p) => {
      nodesById.set(p.nom, { id: p.id, nom: p.nom, pack: p.pack, niveau: p.niveau, actif: p.actif, solde: p.solde, filleuls: [] });
    });
    const root: NoeudReseau = {
      id: 'root', nom: 'Cuteness Collaboration', pack: '', niveau: 0, actif: true,
      solde: partenaires.reduce((s, p) => s + p.solde, 0), filleuls: [],
    };
    partenaires.forEach((p) => {
      const node = nodesById.get(p.nom);
      if (!node) return;
      if (p.parrain && nodesById.has(p.parrain)) {
        nodesById.get(p.parrain)!.filleuls.push(node);
      } else {
        root.filleuls.push(node);
      }
    });
    this.reseau$.next(root);
  }

  private mapReseauNode(node: any, niveau: number = 1): NoeudReseau {
    return {
      id: node.id ?? 'unknown', 
      nom: node.nom ?? 'Inconnu', 
      pack: node.pack ?? 'Aucun',
      niveau: node.niveau ?? niveau, 
      actif: node.actif ?? true, 
      solde: Number(node.solde ?? 0),
      filleuls: (node.filleuls ?? []).map((c: any) => this.mapReseauNode(c, niveau + 1)),
    };
  }

  private mapCommission(c: CommissionDto): Commission {
    return {
      id:         String(c.id ?? ''),
      partenaire: c.partenaire  ?? 'Inconnu',
      source:     c.source      ?? 'Reseau',
      montant:    Number(c.montant  ?? 0),
      niveau:     Number(c.niveau   ?? 1),
      statut:     c.statut      ?? 'EN_ATTENTE',
      date:       this._shared.formatDate(c.date),
      pack:       c.pack        ?? 'Aucun',
    };
  }

  private mapTransaction(t: TransactionDto): Transaction {
    return {
      id:           String(t.id ?? ''),
      partenaire:   t.partenaire   ?? 'Inconnu',
      type:         t.type === 'BOUTIQUE' ? 'BOUTIQUE' : 'PACK',
      description:  t.description  ?? '',
      montant:      Number(t.montant      ?? 0),
      reduction:    Number(t.reduction    ?? 0),
      montantFinal: Number(t.montantFinal ?? t.montant ?? 0),
      statut:       (t.statut as 'PAYEE' | 'EN_ATTENTE' | 'ANNULEE') ?? 'PAYEE',
      date:         this._shared.formatDate(t.date),
    };
  }

  private mapPartenaire(p: PartenaireDto): Partenaire {
    const validPayment = (['CARTE', 'EDINAR'] as const).includes(p.typePayment as 'CARTE' | 'EDINAR')
      ? p.typePayment
      : 'RIB';
    return {
      id:           String(p.id ?? ''),
      userId:       p.userId       ?? 0,
      nom:          p.nom          ?? '',
      email:        p.email        ?? '',
      pack:         p.pack         ?? 'Aucun',
      solde:        Number(p.solde        ?? 0),
      niveau:       Number(p.niveau       ?? 1),
      actif:        !!p.actif,
      typePayment:  validPayment   as 'CARTE' | 'RIB' | 'EDINAR',
      infoBancaire: p.infoBancaire ?? 'N/A',
      banque:       p.banque       ?? '',
      parrain:      p.parrain      ?? null,
      filleuls:     Number(p.filleuls     ?? 0),
      totalGains:   Number(p.totalGains   ?? 0),
    };
  }

  private mapVirement(v: VirementDto): Virement {
    return {
      id:           String(v.id ?? ''),
      partenaire:   v.partenaire   ?? 'Inconnu',
      montant:      Number(v.montant      ?? 0),
      infoBancaire: v.infoBancaire  ?? 'N/A',
      typePayment:  v.typePayment   ?? 'RIB',
      statut:       (v.statut as 'EN_ATTENTE' | 'EFFECTUE' | 'ECHEC') ?? 'EN_ATTENTE',
      date:         this._shared.formatDate(v.date),
      semaine:      v.semaine       ?? '',
    };
  }
}
