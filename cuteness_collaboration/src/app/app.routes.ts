import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';
import { Role } from './shared/models/user.model';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/public/home/home').then((m) => m.HomeComponent),
  },

  {
    path: 'packs',
    loadComponent: () => import('./features/public/packs/packs').then((m) => m.PacksComponent),
  },

  {
    path: 'packs/:packId/sous-packs/:subpackId',
    loadComponent: () => import('./features/public/packs/sous-pack-detail/sous-pack-detail').then((m) => m.SousPackDetailComponent),
  },

  {
    path: 'packs/:id',
    loadComponent: () => import('./features/public/packs/pack-detail-page/pack-detail-page').then((m) => m.PackDetailPageComponent),
  },

  {
    path: 'formations',
    loadComponent: () => import('./features/public/formations/formations').then((m) => m.FormationsComponent),
  },

  {
    path: 'boutique',
    loadComponent: () => import('./features/public/boutique/boutique').then((m) => m.BoutiqueComponent),
  },

  {
    path: 'boutique/:id',
    loadComponent: () => import('./features/public/boutique/produit-detail/produit-detail').then((m) => m.ProduitDetailComponent),
  },

  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () => import('./features/public/checkout/checkout').then((m) => m.CheckoutComponent),
  },

  {
    path: 'checkout/success',
    canActivate: [authGuard],
    loadComponent: () => import('./features/public/checkout/checkout-success').then((m) => m.CheckoutSuccessComponent),
  },

  {
    path: 'auth',
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginComponent),
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./features/auth/reset-password/reset-password').then(
            (m) => m.ResetPasswordComponent,
          ),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register').then((m) => m.RegisterComponent),
      },
      {
        path: 'register-success',
        loadComponent: () =>
          import('./features/auth/register-success/register-success').then(
            (m) => m.RegisterSuccessComponent,
          ),
      },
      {
        path: 'verify-otp',
        loadComponent: () =>
          import('./features/auth/verify-otp/verify-otp').then(
            (m) => m.VerifyOtpComponent,
          ),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: [Role.ADMIN, Role.SUPERVISEUR] },
    loadComponent: () =>
      import('./features/admin/dashboard/admin-dashboard')
        .then(m => m.AdminDashboardComponent),
    children: [
      { path: '', redirectTo: 'accueil', pathMatch: 'full' },
      { path: 'accueil',         loadComponent: () => import('./features/admin/pages/accueil/admin-accueil').then(m => m.AdminAccueilComponent) },
      { path: 'reseau',          loadComponent: () => import('./features/admin/pages/reseau/admin-reseau').then(m => m.AdminReseauComponent) },
      { path: 'packs',           loadComponent: () => import('./features/admin/pages/packs/admin-packs').then(m => m.AdminPacksComponent) },
      { path: 'boutique',        loadComponent: () => import('./features/admin/pages/boutique/admin-boutique').then(m => m.AdminBoutiqueComponent) },
      { path: 'commandes',       loadComponent: () => import('./features/admin/pages/commandes/admin-commandes').then(m => m.AdminCommandesComponent) },
      { path: 'commissions',     loadComponent: () => import('./features/admin/pages/commissions/admin-commissions').then(m => m.AdminCommissionsComponent) },
      { path: 'transactions',    loadComponent: () => import('./features/admin/pages/transactions/admin-transactions').then(m => m.AdminTransactionsComponent) },
      { path: 'rapports',        loadComponent: () => import('./features/comptable/pages/rapports/comptable-rapports').then(m => m.ComptableRapportsComponent) },
      { path: 'bi',              loadComponent: () => import('./features/admin/pages/bi/admin-bi').then(m => m.AdminBiComponent) },
      { path: 'formations',      loadComponent: () => import('./features/admin/pages/formations/admin-formations').then(m => m.AdminFormationsComponent) },
      { path: 'content-manager', loadComponent: () => import('./features/admin/pages/content-manager/admin-content-manager').then(m => m.AdminContentManagerComponent) },
      { path: 'notifications',   loadComponent: () => import('./features/admin/pages/notifications/admin-notifications').then(m => m.AdminNotificationsComponent) },
      { path: 'signalements',    loadComponent: () => import('./features/admin/pages/signalements/admin-signalements').then(m => m.AdminSignalementsComponent) },
      { path: 'challenges',      loadComponent: () => import('./features/admin/pages/challenges/admin-challenges').then(m => m.AdminChallengesComponent) },
      { path: 'grade-config',    loadComponent: () => import('./features/admin/pages/grade-config/admin-grade-config').then(m => m.AdminGradeConfigComponent) },
      { path: 'comptes',         loadComponent: () => import('./features/admin/pages/comptes/admin-comptes').then(m => m.AdminComptesComponent) },
      { path: 'equipe',          loadComponent: () => import('./features/admin/pages/equipe/admin-equipe').then(m => m.AdminEquipeComponent) },
    ],
  },

  {
    path: 'comptable',
    canActivate: [authGuard, roleGuard],
    data: { roles: [Role.ADMIN, Role.COMPTABLE] },
    loadComponent: () =>
      import('./features/comptable/dashboard/comptable-dashboard')
        .then(m => m.ComptableDashboardComponent),
    children: [
      { path: '', redirectTo: 'accueil', pathMatch: 'full' },
      { path: 'accueil',      loadComponent: () => import('./features/comptable/pages/accueil/comptable-accueil').then(m => m.ComptableAccueilComponent) },
      { path: 'commissions',  loadComponent: () => import('./features/comptable/pages/commissions/comptable-commissions').then(m => m.ComptableCommissionsComponent) },
      { path: 'transactions', loadComponent: () => import('./features/comptable/pages/transactions/comptable-transactions').then(m => m.ComptableTransactionsComponent) },
      { path: 'virements',    redirectTo: 'transactions', pathMatch: 'full' },
      { path: 'reseau',       loadComponent: () => import('./features/comptable/pages/reseau/comptable-reseau').then(m => m.ComptableReseauComponent) },
      { path: 'bi',           loadComponent: () => import('./features/comptable/pages/bi/comptable-bi').then(m => m.ComptableBiComponent) },
      { path: 'rapports',     loadComponent: () => import('./features/comptable/pages/rapports/comptable-rapports').then(m => m.ComptableRapportsComponent) },
      { path: 'signalement',  loadComponent: () => import('./features/comptable/pages/signalement/comptable-signalement').then(m => m.ComptableSignalementComponent) },
      { path: 'commandes',    loadComponent: () => import('./features/comptable/pages/commandes/comptable-commandes').then(m => m.ComptableCommandesComponent) },
    ],
  },

  {
    path: 'superviseur',
    canActivate: [authGuard, roleGuard],
    data: { roles: [Role.SUPERVISEUR, Role.ADMIN] },
    loadComponent: () =>
      import('./features/superviseur/dashboard/superviseur-dashboard')
        .then(m => m.SuperviseurDashboardComponent),
    children: [
      { path: '', redirectTo: 'accueil', pathMatch: 'full' },
      { path: 'accueil',      loadComponent: () => import('./features/superviseur/pages/accueil/superviseur-accueil').then(m => m.SuperviseurAccueilComponent) },
      { path: 'reseau',       loadComponent: () => import('./features/comptable/pages/reseau/comptable-reseau').then(m => m.ComptableReseauComponent) },
      { path: 'commandes',    loadComponent: () => import('./features/superviseur/pages/commandes/superviseur-commandes').then(m => m.SuperviseurCommandesComponent) },
      { path: 'packs',        loadComponent: () => import('./features/admin/pages/packs/admin-packs').then(m => m.AdminPacksComponent) },
      { path: 'boutique',     loadComponent: () => import('./features/admin/pages/boutique/admin-boutique').then(m => m.AdminBoutiqueComponent) },
      { path: 'rapports',     loadComponent: () => import('./features/comptable/pages/rapports/comptable-rapports').then(m => m.ComptableRapportsComponent) },
      { path: 'signalements',    loadComponent: () => import('./features/superviseur/pages/signalements/superviseur-signalements').then(m => m.SuperviseurSignalementsComponent) },
      { path: 'notifications',   loadComponent: () => import('./features/superviseur/pages/notifications/superviseur-notifications').then(m => m.SuperviseurNotificationsComponent) },
    ]
  },

  {
    path: 'partner',
    canActivate: [authGuard, roleGuard],
    data: { roles: [Role.PARTENAIRE] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/partner/dashboard/partner-dashboard').then(
            (m) => m.PartnerDashboardComponent,
          ),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/public/unauthorized/unauthorized').then((m) => m.UnauthorizedComponent),
  },

  { path: '**', redirectTo: '' },
];
