import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ProduitService } from '../../../core/services/produit.service';
import { CommandeService } from '../../../core/services/commande.service';
import { DashboardSharedService } from '../../../core/services/dashboard-shared.service';
import { NotificationService, OrderNotification } from '../../../core/services/notification.service';
import { ContentService } from '../../../core/services/content.service';
import { environment } from '../../../../environments/environment';
import { ChatIaComponent } from '../../../shared/components/chat-ia/chat-ia';

type Section =
  | 'accueil'
  | 'reseau'
  | 'commissions'
  | 'commandes'
  | 'boutique'
  | 'formations'
  | 'notifications'
  | 'profil'
  | 'signalement'
  | 'challenges'
  | 'upgrade'
  | 'virements';

@Component({
  selector: 'app-partner-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, RouterLink, ChatIaComponent],
  templateUrl: './partner-dashboard.html',
  styleUrls: ['./partner-dashboard.css'],
})
export class PartnerDashboardComponent implements OnInit, OnDestroy {
  private pointsRefreshInterval: any;
  private badgesInterval: any;
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private dashboardService = inject(DashboardService);
  private produitService = inject(ProduitService);
  private commandeService = inject(CommandeService);
  protected shared = inject(DashboardSharedService);
  private notificationService = inject(NotificationService);
  private contentService = inject(ContentService);

  activeSection: Section = 'accueil';
  sidebarOpen = true;
  isLoading = true;
  errorMsg = '';

  partenaire: any = {
    nom: '',
    email: '',
    pack: '',
    packEmoji: '',
    tauxCommission: 0,
    tauxReduction: 0,
    niveaux: 0,
    solde: 0,
    codeParrainage: '',
    dateInscription: '',
    actif: true,
  };

  kpis: any = {
    solde: 0,
    commissionsTotal: 0,
    commandesTotal: 0,
    filleulsTotal: 0,
    filleulsDirects: 0,
    commissionsEnAttente: 0,
    commandesEnAttente: 0,
  };

  reseau: any = {
    nom: '',
    pack: '',
    filleuls: [],
  };

  commandes: any[] = [];
  produits: any[] = [];
  transactions: any[] = [];
  commissions: any[] = [];
  virements: any[] = [];
  virementsLoading = false;
  filtreVirement: 'TOUS' | 'EN_ATTENTE' | 'EFFECTUE' | 'ECHEC' = 'TOUS';
  notifications: OrderNotification[] = [];
  notificationsLoading = true;
  notificationsError = '';

  formations: any[] = [
    {
      id: 'F1',
      titre: 'Introduction au MLM',
      description: 'Comprendre les bases du marketing de réseau et les stratégies de croissance.',
      duree: '45 min',
      niveau: 'Débutant',
      termine: true,
    },
    {
      id: 'F2',
      titre: 'Techniques de parrainage',
      description: 'Comment recruter efficacement des partenaires et développer votre réseau.',
      duree: '60 min',
      niveau: 'Intermédiaire',
      termine: true,
    },
    {
      id: 'F3',
      titre: 'Maximiser vos commissions',
      description: 'Stratégies avancées pour augmenter vos revenus sur plusieurs niveaux.',
      duree: '90 min',
      niveau: 'Avancé',
      termine: false,
    },
    {
      id: 'F4',
      titre: 'Vente de produits cosmétiques',
      description: 'Techniques de vente adaptées aux produits beauté et parfums de luxe.',
      duree: '50 min',
      niveau: 'Intermédiaire',
      termine: false,
    },
    {
      id: 'F5',
      titre: 'Gestion de votre réseau',
      description: 'Outils et méthodes pour suivre et motiver vos filleuls au quotidien.',
      duree: '75 min',
      niveau: 'Avancé',
      termine: false,
    },
  ];

  boutiqueBannerTexte  = '';
  boutiqueBannerCouleur = '#FF6B5B';
  boutiqueBannerActif  = false;

  prochainVirement: string = '';

  get prochainVirementFormatted(): string {
    if (!this.prochainVirement) return '';
    const d = new Date(this.prochainVirement);
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  filtreCommission = 'TOUS';
  filtreCommande = 'TOUS';
  categories: any[] = [];
  selectedCategorie: number | null = null;
  rechercheBoutique = '';
  panier: { produit: any; qte: number }[] = [];
  panierOpen = false;


  mesPoints: any = { pointsTotal: 0, grade: 'STARTER', progressPct: 0, pointsProchainGrade: 0, seuilProchainGrade: 100 };
  challengesActifs: any[] = [];
  mesParticipations: any[] = [];
  leaderboard: any[] = [];
  challengesLoading = false;
  pointsSources: any[] = [];
  gradeConfigs: any[] = [];
  refreshLoading = false;


  private readonly UPGRADE_API = `${environment.apiUrl}/packs/upgrade`;
  packsDisponibles: any[] = [];
  upgradeHistorique: any[] = [];

  readonly GRADE_ORDER = ['STARTER', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];

  readonly GRADE_SYMBOLS: Record<string, string> = {
    STARTER: '🥉', BRONZE: '🥉', SILVER: '🥈', GOLD: '👑', PLATINUM: '💎', DIAMOND: '💠',
  };

  gradeSymbol(grade: string): string { return this.GRADE_SYMBOLS[grade] ?? '⚡'; }

  isGradeDone(cfg: any): boolean {
    return this.GRADE_ORDER.indexOf(this.mesPoints.grade) > this.GRADE_ORDER.indexOf(cfg.grade);
  }
  isGradeLocked(cfg: any): boolean {
    return this.GRADE_ORDER.indexOf(cfg.grade) > this.GRADE_ORDER.indexOf(this.mesPoints.grade);
  }

  readonly GRADE_ICONS: Record<string, string> = {
    STARTER: '🥉', BRONZE: '🥉', SILVER: '🥈', GOLD: '🥇', PLATINUM: '💎', DIAMOND: '💠',
  };
  readonly GRADE_COLORS: Record<string, string> = {
    STARTER: '#94a3b8', BRONZE: '#cd7f32', SILVER: '#c0c0c0',
    GOLD: '#ffd700', PLATINUM: '#e5e4e2', DIAMOND: '#b9f2ff',
  };
  readonly CH_TYPE_LABELS: Record<string, string> = {
    PARRAINAGE: 'Parrainer un ami', COMMANDE: 'Passer une commande',
    COMMISSION: 'Générer une commission', FORMATION: 'Terminer une formation',
    ACHAT_PACK: 'Acheter un pack',
  };
  readonly CH_TYPE_ICONS: Record<string, string> = {
    PARRAINAGE: '👥', COMMANDE: '🛒', COMMISSION: '💰',
    FORMATION: '🎓', ACHAT_PACK: '📦',
  };

  ngOnInit(): void {
    this.loadDashboard();
    this.loadProduits();
    this.loadCategories();
    this.loadCommandes();
    this.loadNotifications();
    this.loadDateVirement();
    this.loadBoutiqueBanner();
    this.loadMesSignalements();
    this.loadMesPoints();
    this.loadChallenges();
    this.loadVirements();
    this.pointsRefreshInterval = setInterval(() => {
      if (this.activeSection === 'challenges') this.refreshPoints();
    }, 30000);
    this.badgesInterval = setInterval(() => this.refreshBadgeCounts(), 30_000);
  }

  ngOnDestroy(): void {
    if (this.pointsRefreshInterval) clearInterval(this.pointsRefreshInterval);
    if (this.badgesInterval) clearInterval(this.badgesInterval);
  }

  private refreshBadgeCounts(): void {
    this.dashboardService.getPartnerDashboard().subscribe({
      next: (data) => {
        this.kpis.commissionsEnAttente = (data.commissions ?? [])
          .filter((c: any) => c.statut === 'EN_ATTENTE').length;
      },
      error: () => {},
    });
    this.notificationService.getMesNotifications().subscribe({
      next: (data) => { this.notifications = data; },
      error: () => {},
    });
    this.commandeService.getMesCommandes().subscribe({
      next: (data) => {
        this.commandes = data.map((c: any) => ({
          id: 'CMD' + String(c.id).padStart(3, '0'),
          produit: c.lignes?.[0]?.nomProduit ?? 'Commande #' + c.id,
          montant: c.montantTotal,
          statut: c.statut === 'LIVREE' ? 'PAYEE' : c.statut === 'EN_ATTENTE' ? 'EN_ATTENTE' : 'ANNULEE',
          date: c.dateCommande ? new Date(c.dateCommande).toLocaleDateString('fr-FR') : 'N/A',
        }));
        this.kpis.commandesEnAttente = this.commandes.filter((c: any) => c.statut === 'EN_ATTENTE').length;
      },
      error: () => {},
    });
    this.http.get<any[]>(`${this.SIG_API}/mes-signalements`).subscribe({
      next: (data) => { this.mesSignalements = data ?? []; },
      error: () => {},
    });
  }

  get signalementAvecReponseCount(): number {
    return this.mesSignalements.filter(s => s.reponseSuperviseur || s.reponseAdmin).length;
  }

  loadBoutiqueBanner(): void {
    this.contentService.loadAll().subscribe({
      next: () => {
        this.boutiqueBannerTexte  = this.contentService.get('boutique', 'banniere_texte', '');
        this.boutiqueBannerCouleur = this.contentService.get('boutique', 'banniere_couleur', '#FF6B5B');
        this.boutiqueBannerActif  = this.contentService.get('boutique', 'banniere_actif', 'false') === 'true';
      },
      error: () => {},
    });
  }

  loadDateVirement(): void {
    const stored = localStorage.getItem('dateVirement');
    if (stored) {
      this.prochainVirement = stored;
    }
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.dashboardService.getPartnerDashboard().subscribe({
      next: (data) => {
        const dateInscription = data.dateCreation
          ? new Date(data.dateCreation).toLocaleDateString('fr-FR')
          : '—';

        this.partenaire = {
          nom:            data.nom            ?? '',
          email:          data.email          ?? '',
          telephone:      data.telephone      ?? '',
          region:         data.region         ?? '',
          pack:           data.monPack        ?? 'Aucun',
          packEmoji:      this.shared.packEmoji(data.monPack),
          tauxCommission: data.tauxCommission ?? 0,
          tauxReduction:  data.tauxReduction  ?? 0,
          niveaux:        data.niveaux        ?? 1,
          solde:          data.soldeInterne   ?? 0,
          codeParrainage: data.codeParrainage ?? '',
          parrain:        data.parrain        ?? null,
          dateInscription,
          actif:          data.statut         ?? false,
        };

        const commissions: any[] = (data.commissions ?? []).map((c: any) => ({
          id:      c.id,
          source:  c.source        ?? 'Réseau MLM',
          partenaire: c.sourceUserNom ?? c.source ?? 'Réseau',
          montant: c.montant,
          niveau:  c.niveau        ?? 1,
          statut:  c.statut        ?? 'EN_ATTENTE',
          date:    c.date ? new Date(c.date).toLocaleDateString('fr-FR') : '—',
        }));

        this.commissions = commissions;

        const commissionsEnAttente = commissions.filter(c => c.statut === 'EN_ATTENTE').length;

        this.kpis = {
          solde:               data.soldeInterne   ?? 0,
          commissionsTotal:    data.totalCommissions ?? 0,
          commandesTotal:      data.totalCommandes  ?? 0,
          filleulsTotal:       data.reseauTotal     ?? 0,
          filleulsDirects:     data.filleulsDirects ?? 0,
          commissionsEnAttente,
          commandesEnAttente:  0,
        };

        this.reseau = data.reseau ?? { nom: data.nom, pack: data.monPack, filleuls: [] };
        if (!this.reseau.filleuls) this.reseau.filleuls = [];

        // Recalculer prixFinal avec le vrai tauxReduction une fois le dashboard chargé
        const taux = this.partenaire.tauxReduction;
        if (taux > 0 && this.produits.length > 0) {
          this.produits = this.produits.map(p => {
            const prixBase = (p.enPromo && p.prixPromo) ? p.prixPromo : p.prix;
            return { ...p,
              commission: +((prixBase * taux) / 100).toFixed(2),
              prixFinal:  +(prixBase * (1 - taux / 100)).toFixed(2),
            };
          });
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Dashboard error:', err);
        this.errorMsg = 'Erreur de chargement';
        this.isLoading = false;
      },
    });
  }

  loadNotifications(): void {
    this.notificationsLoading = true;
    this.notificationsError = '';
    this.notificationService.getMesNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
        this.notificationsLoading = false;
      },
      error: (err) => {
        console.error('❌ Notifications error:', err);
        this.notificationsError = 'Impossible de charger les notifications. Veuillez réessayer.';
        this.notificationsLoading = false;
      },
    });
  }

  loadCategories(): void {
    this.produitService.getCategories().subscribe({
      next: (data) => { this.categories = data; },
      error: () => {},
    });
  }

  loadProduits(): void {
    this.produitService.getAllProduits().subscribe({
      next: (data) => {
        // tauxReduction peut ne pas encore être chargé (race condition avec loadDashboard)
        // On stocke les produits bruts et on recalcule dans loadDashboard si nécessaire
        const taux = this.partenaire.tauxReduction ?? 0;
        this.produits = data.map((p) => {
          const prixBase = (p.enPromo && p.prixPromo) ? p.prixPromo : p.prix;
          return {
            ...p,
            commission: +((prixBase * taux) / 100).toFixed(2),
            prixFinal:  +(prixBase * (1 - taux / 100)).toFixed(2),
          };
        });
      },
      error: (err) => console.error('❌ Produits error:', err),
    });
  }

  loadCommandes(): void {
    this.commandeService.getMesCommandes().subscribe({
      next: (data) => {
        this.commandes = data.map((c) => ({
          id: 'CMD' + String(c.id).padStart(3, '0'),
          produit: c.lignes?.[0]?.nomProduit ?? 'Commande #' + c.id,
          montant: c.montantTotal,
          statut:
            c.statut === 'LIVREE' ? 'PAYEE' : c.statut === 'EN_ATTENTE' ? 'EN_ATTENTE' : 'ANNULEE',
          date: c.dateCommande ? new Date(c.dateCommande).toLocaleDateString('fr-FR') : 'N/A',
        }));

        this.kpis.commandesEnAttente = this.commandes.filter(
          (c) => c.statut === 'EN_ATTENTE',
        ).length;
      },
      error: (err) => console.error('❌ Commandes error:', err),
    });
  }

  loadVirements(): void {
    this.virementsLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}/dashboard/mes-virements`).subscribe({
      next: (data) => { this.virements = data ?? []; this.virementsLoading = false; },
      error: () => { this.virementsLoading = false; },
    });
  }

  get virementsFiltered(): any[] {
    if (this.filtreVirement === 'TOUS') return this.virements;
    return this.virements.filter(v => v.statut === this.filtreVirement);
  }

  get virementsTotalRecu(): number {
    return this.virements
      .filter(v => v.statut === 'EFFECTUE')
      .reduce((sum, v) => sum + (v.montant ?? 0), 0);
  }

  get virementsEnAttente(): number {
    return this.virements.filter(v => v.statut === 'EN_ATTENTE').length;
  }

  get virementsEffectues(): number {
    return this.virements.filter(v => v.statut === 'EFFECTUE').length;
  }

  setSection(s: Section): void {
    this.activeSection = s;
    if (window.innerWidth < 768) this.sidebarOpen = false;
    if (s === 'notifications') this.notifications.forEach((n) => (n.lu = true));
    if (s === 'signalement') this.loadMesSignalements();
    if (s === 'challenges') this.loadChallenges();
    if (s === 'upgrade') this.loadUpgrade();
    if (s === 'virements') this.loadVirements();
  }

  loadUpgrade(): void {
    this.http.get<any[]>(`${this.UPGRADE_API}/disponibles`).subscribe({
      next: (data) => { this.packsDisponibles = data; },
      error: () => {},
    });
    this.http.get<any[]>(`${this.UPGRADE_API}/historique`).subscribe({
      next: (data) => { this.upgradeHistorique = data; },
      error: () => {},
    });
  }

  goToPack(packId: number): void {
    this.router.navigate(['/packs', packId]);
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  copierCode(): void {
    navigator.clipboard?.writeText(this.partenaire.codeParrainage);
  }

  logout(): void {
    this.shared.logout();
  }

  goToDetail(id: number): void {
    this.router.navigate(['/boutique', id]);
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => (n.lu = true));
  }

  get commissionsFiltered(): any[] {
    if (this.filtreCommission === 'TOUS') return this.commissions;
    return this.commissions.filter((c) => c.statut === this.filtreCommission);
  }

  get commandesFiltered(): any[] {
    if (this.filtreCommande === 'TOUS') return this.commandes;
    return this.commandes.filter((c) => c.statut === this.filtreCommande);
  }

  get produitsFiltered(): any[] {
    let list = this.produits;
    if (this.selectedCategorie !== null) {
      list = list.filter(p => p.categorie?.id === this.selectedCategorie);
    }
    const q = this.rechercheBoutique.trim().toLowerCase();
    if (q) list = list.filter(p => p.nom.toLowerCase().includes(q));
    // Best sellers first, then promos, then the rest
    return [...list].sort((a, b) => {
      if (a.bestSeller && !b.bestSeller) return -1;
      if (!a.bestSeller && b.bestSeller) return 1;
      if (a.enPromo && !b.enPromo) return -1;
      if (!a.enPromo && b.enPromo) return 1;
      return 0;
    });
  }

  get bestSellers(): any[] {
    return this.produits.filter(p => p.bestSeller);
  }

  stockClass(stock: number): string {
    if (stock === 0) return 'stock-rupture';
    if (stock < 20) return 'stock-low';
    return 'stock-ok';
  }

  stockLabel(stock: number): string {
    if (stock === 0) return 'Rupture de stock';
    if (stock < 20) return `⚠ ${stock} restants`;
    return `${stock} en stock`;
  }

  promoPercent(p: any): number {
    if (!p.enPromo || !p.prixPromo || !p.prix) return 0;
    return Math.round((p.prix - p.prixPromo) / p.prix * 100);
  }

  get mediaBase(): string {
    return environment.apiUrl.replace('/api', '');
  }

  getImageUrl(url: string | undefined): string {
    if (!url) return 'assets/placeholder.jpg';
    return url.startsWith('http') ? url : `${this.mediaBase}${url}`;
  }

  addToCart(p: any): void {
    const existing = this.panier.find(i => i.produit.id === p.id);
    if (existing) {
      existing.qte++;
    } else {
      this.panier.push({ produit: p, qte: 1 });
    }
    this.panierOpen = true;
  }

  removeFromCart(produitId: number): void {
    this.panier = this.panier.filter(i => i.produit.id !== produitId);
  }

  get totalPanier(): number {
    return this.panier.reduce((sum, i) => sum + i.produit.prixFinal * i.qte, 0);
  }

  get panierCount(): number {
    return this.panier.reduce((sum, i) => sum + i.qte, 0);
  }

  // ── Signalement modal ──────────────────────────────────
  showSignalementModal = false;
  sigType     = 'COMMANDE';
  sigDesc     = '';
  sigPriorite = 'MOYENNE';
  sigFile: File | null = null;
  sigLoading  = false;
  sigSuccess  = '';
  sigError    = '';

  // ── Mes signalements ───────────────────────────────────
  mesSignalements: any[] = [];
  sigListLoading = false;

  private readonly SIG_API = `${environment.apiUrl}/signalements`;

  openSignalementModal(): void {
    this.showSignalementModal = true;
    this.sigSuccess = '';
    this.sigError   = '';
    this.sigDesc    = '';
    this.sigFile    = null;
  }

  closeSignalementModal(): void {
    this.showSignalementModal = false;
  }

  onSigFileChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.sigFile = input.files?.[0] ?? null;
  }

  envoyerSignalement(): void {
    if (!this.sigDesc.trim()) { this.sigError = 'Veuillez décrire le problème.'; return; }
    this.sigLoading = true;
    this.sigError   = '';
    const fd = new FormData();
    fd.append('type',        this.sigType);
    fd.append('description', this.sigDesc.trim());
    fd.append('priorite',    this.sigPriorite);
    if (this.sigFile) fd.append('file', this.sigFile);
    this.http.post<any>(this.SIG_API, fd).subscribe({
      next: (res) => {
        this.sigLoading = false;
        this.sigSuccess = 'Signalement envoyé ! Notre équipe va traiter votre demande.';
        this.mesSignalements = [res, ...this.mesSignalements];
        this.sigDesc = '';
        this.sigFile = null;
        setTimeout(() => { this.showSignalementModal = false; this.sigSuccess = ''; }, 2500);
      },
      error: (err) => {
        this.sigLoading = false;
        this.sigError = err?.error?.message ?? 'Erreur lors de l\'envoi. Veuillez réessayer.';
      },
    });
  }

  loadMesSignalements(): void {
    this.sigListLoading = true;
    this.http.get<any[]>(`${this.SIG_API}/mes-signalements`).subscribe({
      next: (data) => { this.mesSignalements = data ?? []; this.sigListLoading = false; },
      error: ()    => { this.sigListLoading = false; },
    });
  }

  sigStatutLabel(s: string): string {
    const m: Record<string, string> = {
      ENVOYE: 'Envoyé', EN_COURS: 'En cours', ESCALADE: 'Escaladé', RESOLU: 'Résolu',
    };
    return m[s] ?? s;
  }

  sigStatutClass(s: string): string {
    const m: Record<string, string> = {
      ENVOYE: 'sig-st-open', EN_COURS: 'sig-st-progress',
      ESCALADE: 'sig-st-escalade', RESOLU: 'sig-st-done',
    };
    return m[s] ?? 'sig-st-open';
  }

  sigTypeLabel(t: string): string {
    const m: Record<string, string> = {
      COMMANDE: 'Commande', PAIEMENT: 'Paiement',
      COMMISSION: 'Commission', TECHNIQUE: 'Technique',
    };
    return m[t] ?? t;
  }

  // ── Points (called on init so accueil shows real data) ────────────────
  loadMesPoints(): void {
    this.http.get<any>(`${environment.apiUrl}/points/mes-points`).subscribe({
      next: (data) => { this.mesPoints = data; },
      error: () => {},
    });
  }

  // ── Challenges ─────────────────────────────────────────
  loadChallenges(): void {
    this.challengesLoading = true;
    this.refreshLoading = true;
    this.http.get<any>(`${environment.apiUrl}/points/mes-points`).subscribe({
      next: (data) => { this.mesPoints = data; },
      error: () => {},
    });
    this.http.get<any[]>(`${environment.apiUrl}/challenges`).subscribe({
      next: (data) => { this.challengesActifs = data ?? []; this.challengesLoading = false; this.refreshLoading = false; },
      error: () => { this.challengesLoading = false; this.refreshLoading = false; },
    });
    this.http.get<any[]>(`${environment.apiUrl}/challenges/mes-participations`).subscribe({
      next: (data) => { this.mesParticipations = data ?? []; },
      error: () => {},
    });
    this.http.get<any[]>(`${environment.apiUrl}/points/leaderboard`).subscribe({
      next: (data) => { this.leaderboard = data ?? []; },
      error: () => {},
    });
    this.http.get<any[]>(`${environment.apiUrl}/points/sources`).subscribe({
      next: (data) => { this.pointsSources = (data ?? []).filter(s => s.actif); },
      error: () => {},
    });
    this.http.get<any[]>(`${environment.apiUrl}/grade-configs/public`).subscribe({
      next: (data) => { this.gradeConfigs = data ?? []; },
      error: () => {},
    });
  }

  actionIcon(type: string): string {
    const icons: Record<string, string> = {
      PARRAINAGE: '🤝', COMMANDE_LIVREE: '📦', FORMATION: '🎓', ACHAT_PACK: '🚀', CHALLENGE: '🏆', GRADE_BONUS: '⭐',
    };
    return icons[type] ?? '⚡';
  }

  actionLabel(type: string): string {
    const labels: Record<string, string> = {
      PARRAINAGE: 'Parrainage', COMMANDE_LIVREE: 'Commande livrée', FORMATION: 'Formation terminée',
      ACHAT_PACK: 'Achat de pack', CHALLENGE: 'Challenge', GRADE_BONUS: 'Montée de grade',
    };
    return labels[type] ?? type;
  }

  actionDesc(type: string): string {
    const descs: Record<string, string> = {
      PARRAINAGE: 'Invitez un ami à rejoindre la famille Cuteness',
      COMMANDE_LIVREE: 'Chaque commande livrée compte dans votre score',
      FORMATION: 'Apprenez et progressez pour gagner des points',
      ACHAT_PACK: 'Montez en gamme et récoltez vos récompenses',
      CHALLENGE: 'Participez aux challenges lancés par l\'admin',
      GRADE_BONUS: 'Franchissez un nouveau grade et soyez récompensé',
    };
    return descs[type] ?? '';
  }

  actionTheme(type: string): string {
    const themes: Record<string, string> = {
      PARRAINAGE: 'theme-coral', COMMANDE_LIVREE: 'theme-mint',
      FORMATION: 'theme-blue', ACHAT_PACK: 'theme-gold',
      CHALLENGE: 'theme-purple', GRADE_BONUS: 'theme-pink',
    };
    return themes[type] ?? 'theme-coral';
  }

  participer(challengeId: number): void {
    this.http.post<any>(`${environment.apiUrl}/challenges/${challengeId}/participer`, {}).subscribe({
      next: (p) => {
        const idx = this.mesParticipations.findIndex(mp => mp.challengeId === challengeId);
        if (idx >= 0) {
          this.mesParticipations[idx] = p;
          this.mesParticipations = [...this.mesParticipations];
        } else {
          this.mesParticipations = [p, ...this.mesParticipations];
        }
      },
      error: () => {},
    });
  }

  isParticipant(challengeId: number): boolean {
    return this.mesParticipations.some(p => p.challengeId === challengeId);
  }

  getParticipation(challengeId: number): any {
    return this.mesParticipations.find(p => p.challengeId === challengeId);
  }

  getConditionProgress(participation: any, conditionId: number): any {
    if (!participation?.conditions) return null;
    return participation.conditions.find((cp: any) => cp.conditionId === conditionId) ?? null;
  }

  refreshPoints(): void {
    this.refreshLoading = true;
    this.http.get<any>(`${environment.apiUrl}/points/mes-points`).subscribe({
      next: (data) => { this.mesPoints = data; this.refreshLoading = false; },
      error: () => { this.refreshLoading = false; },
    });
    this.http.get<any[]>(`${environment.apiUrl}/challenges/mes-participations`).subscribe({
      next: (data) => { this.mesParticipations = data ?? []; },
      error: () => {},
    });
    this.http.get<any[]>(`${environment.apiUrl}/points/leaderboard`).subscribe({
      next: (data) => { this.leaderboard = data ?? []; },
      error: () => {},
    });
  }

  get chatContext(): Record<string, any> {
    return {
      nom:                  this.partenaire.nom,
      pack:                 this.partenaire.pack,
      solde:                this.kpis.solde,
      commissionsTotal:     this.kpis.commissionsTotal,
      commissionsEnAttente: this.kpis.commissionsEnAttente,
      commandesTotal:       this.kpis.commandesTotal,
      commandesEnAttente:   this.kpis.commandesEnAttente,
      filleulsTotal:        this.kpis.filleulsTotal,
      filleulsDirects:      this.kpis.filleulsDirects,
      tauxCommission:       this.partenaire.tauxCommission,
      tauxReduction:        this.partenaire.tauxReduction,
      grade:                this.mesPoints.grade,
      pointsTotal:          this.mesPoints.pointsTotal,
      virementsEnAttente:   this.virementsEnAttente,
      virementsTotalRecu:   this.virementsTotalRecu,
      dateInscription:      this.partenaire.dateInscription,
      region:               this.partenaire.region,
      codeParrainage:       this.partenaire.codeParrainage,
    };
  }

  gradeIcon(grade: string): string { return this.GRADE_ICONS[grade] ?? '🥉'; }
  gradeColor(grade: string): string { return this.GRADE_COLORS[grade] ?? '#94a3b8'; }

  get isMaxGrade(): boolean {
    return this.mesPoints.grade === this.GRADE_ORDER[this.GRADE_ORDER.length - 1];
  }

  get notifsNonLues(): OrderNotification[] {
    return this.notifications.filter((n) => !n.lu);
  }

  get notifCount(): number {
    return this.notifsNonLues.length;
  }

  get formationsProgress(): number {
    const done = this.formations.filter((f) => f.termine).length;
    return this.formations.length > 0 ? Math.round((done / this.formations.length) * 100) : 0;
  }

  notifIcon(type: string, statut?: string): string {
    if (type === 'ORDER_STATUS') {
      if (statut === 'LIVREE')    return 'fas fa-check-circle';
      if (statut === 'ANNULEE')   return 'fas fa-times-circle';
      return 'fas fa-clock';
    }
    return this.shared.notifIcon(type as any);
  }

  notifColor(type: string, statut?: string): string {
    if (type === 'ORDER_STATUS') {
      if (statut === 'LIVREE')  return 'ni-green';
      if (statut === 'ANNULEE') return 'ni-red';
      return 'ni-gold';
    }
    return this.shared.notifColor(type as any);
  }

  transactionIcon(type: string): string {
    return this.shared.transactionIcon(type as any);
  }

  transactionColor(type: string): string {
    return this.shared.transactionColor(type as any);
  }
}
