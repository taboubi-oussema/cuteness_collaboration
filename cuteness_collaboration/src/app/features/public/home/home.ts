import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule }             from '@angular/common';
import { RouterLink, Router }       from '@angular/router';
import { HttpClient }               from '@angular/common/http';
import { ContentService }           from '../../../core/services/content.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit, AfterViewInit {

  private contentService = inject(ContentService);
  private http           = inject(HttpClient);
  constructor(private router: Router) {}

  lang: 'fr' | 'ar' = 'fr';

  get isRtl(): boolean { return this.lang === 'ar'; }

  toggleLang(): void {
    this.lang = this.lang === 'fr' ? 'ar' : 'fr';
  }

  t(key: string): string {
    return this.i18n[key]?.[this.lang] ?? this.i18n[key]?.['fr'] ?? key;
  }

  tr(cmsValue: string, arKey: string): string {
    return this.lang === 'ar' ? this.t(arKey) : cmsValue;
  }

  packName(pack: any): string {
    return this.lang === 'ar' && pack.nomAr ? pack.nomAr : pack.nom;
  }

  packFeatures(pack: any): string[] {
    const desc = this.lang === 'ar' && pack.featuresAr
      ? pack.featuresAr
      : (pack.featuresFr ?? pack.features ?? '');
    return this.splitDesc(desc);
  }

  readonly i18n: Record<string, { fr: string; ar: string }> = {
    hero_badge:          { fr: 'Plateforme MLM nouvelle génération', ar: 'منصة تسويق شبكي من الجيل الجديد' },
    hero_titre:          { fr: 'Développez votre réseau, ensemble.', ar: 'طوّر شبكتك، معاً.' },
    hero_sous_titre:     { fr: 'Gérez vos partenaires, suivez vos commissions multi-niveaux et boostez votre activité MLM depuis une seule plateforme intuitive et puissante.', ar: 'أدر شركاءك، تتبّc عمولاتك متعددة المستويات وعزّز نشاطك في التسويق الشبكي من منصة واحدة سهلة الاستخدام.' },
    hero_cta_primaire:   { fr: 'Commencer maintenant', ar: 'ابدأ الآن' },
    hero_cta_secondaire: { fr: 'Voir la démo',         ar: 'شاهد العرض' },
    cta_titre:           { fr: 'Prêt à développer votre réseau ?', ar: 'هل أنت مستعد لتطوير شبكتك؟' },
    cta_desc_text:       { fr: 'Rejoignez des centaines de partenaires qui développent déjà leur activité sur Cuteness Collaboration.', ar: 'انضم إلى مئات الشركاء الذين يطوّرون نشاطهم بالفعل على منصة Cuteness Collaboration.' },
    boutique_title_cms:  { fr: 'Achetez et revendez nos produits', ar: 'اشترِ وأعد بيع منتجاتنا' },
    boutique_sub_cms:    { fr: 'Accédez à notre catalogue et générez des commissions sur chaque vente.', ar: 'تصفّح كتالوجنا وولّد عمولات على كل عملية بيع.' },
    footer_desc_cms:     { fr: 'La plateforme MLM nouvelle génération pour développer votre réseau de partenaires en Tunisie.', ar: 'منصة التسويق الشبكي من الجيل الجديد لتطوير شبكة شركائك في تونس.' },
    nav_features:    { fr: 'Fonctionnalités',             ar: 'الميزات' },
    nav_packs:       { fr: 'Packs',                       ar: 'الباقات' },
    nav_formations:  { fr: 'Formations',                  ar: 'التكوينات' },
    nav_how:         { fr: 'Comment ça marche',           ar: 'كيف يعمل' },
    nav_boutique:    { fr: 'Boutique',                    ar: 'المتجر' },
    nav_challenges:  { fr: 'Challenges',                  ar: 'التحديات' },
    nav_testimonials:{ fr: 'Témoignages',                 ar: 'آراء العملاء' },
    nav_login:       { fr: 'Se connecter',                ar: 'تسجيل الدخول' },
    nav_join:        { fr: 'Rejoindre',                   ar: 'انضم إلينا' },
    mock_hello:      { fr: 'Bonjour, Equipe Cuteness ', ar: 'أهلاً، فريق Cuteness ' },
    mock_sub:        { fr: '12 commissions en attente · +18 partenaires ce mois', ar: '12 عمولة في الانتظار · +18 شريك هذا الشهر' },
    mock_commission: { fr: 'Commission validée',          ar: 'عمولة مُوافق عليها' },
    mock_ago:        { fr: 'il y a 2 min',               ar: 'منذ دقيقتين' },
    mock_newpartner: { fr: 'Nouveau partenaire',          ar: 'شريك جديد' },
    mock_level:      { fr: 'Niveau 2 · Pack Silver',      ar: 'المستوى 2 · باقة Silver' },
    mock_kpi_partners: { fr: 'Partenaires actifs',        ar: 'شركاء نشطون' },
    mock_kpi_commissions: { fr: 'Commissions DT',         ar: 'عمولات DT' },
    mock_kpi_orders: { fr: 'Commandes',                   ar: 'الطلبات' },
    mock_kpi_revenue:{ fr: 'CA en DT',                   ar: 'رقم الأعمال DT' },
    mock_chart:      { fr: 'Évolution des Soldes Partenaires', ar: 'تطور أرصدة الشركاء' },
    mock_export:     { fr: 'Exporter CSV ↗',              ar: 'تصدير CSV ↗' },
    mock_partners_lbl: { fr: 'Partenaires',               ar: 'الشركاء' },
    mock_commissions_lbl: { fr: 'Commissions',            ar: 'العمولات' },
    mock_deliveries_lbl:  { fr: 'Livraisons',             ar: 'التوصiles' },
    stat_partners:   { fr: 'Partenaires actifs',          ar: 'شركاء نشطون' },
    stat_commissions:{ fr: 'Commissions ce mois',         ar: 'عمولات هذا الشهر' },
    stat_delivery:   { fr: 'Taux de livraison',           ar: 'معدل التوصيل' },
    stat_revenue:    { fr: "Chiffre d'affaires",          ar: 'رقم الأعمال' },
    feat_tag:        { fr: 'Fonctionnalités',             ar: 'المزايا' },
    feat_title:      { fr: 'Tout ce dont vous avez besoin pour gérer votre réseau MLM', ar: 'كل ما تحتاجه لإدارة شبكتك' },
    feat_desc:       { fr: 'Une plateforme complète conçue pour les partenaires ambitieux et les administrateurs exigeants.', ar: 'منصة متكاملة مصممة للشركاء الطموحين والمدراء المحترفين.' },
    feat1_title:     { fr: 'Arbre Réseau MLM Dynamique',  ar: 'شجرة الشبكة الدينamيكية' },
    feat1_desc:      { fr: 'Visualisez et gérez votre réseau multi-niveaux en temps réel. Invitez des partenaires via votre code unique.', ar: 'تصور وأدر شبكتك متعددة المستويات في الوقت الفعلي. ادعُ الشركاء عبر رمزك الفريد.' },
    feat1_tag1:      { fr: 'Multi-niveaux',               ar: 'متعدد المستويات' },
    feat1_tag2:      { fr: 'Code parrainage',             ar: 'رمز الإحالة' },
    feat1_tag3:      { fr: 'Temps réel',                  ar: 'الوقت الفعلي' },
    feat2_title:     { fr: 'KPIs & Analytics',            ar: 'مؤشرات الأداء والتحليلات' },
    feat2_desc:      { fr: 'Tableaux de bord interactifs avec indicateurs clés : ventes, commissions, partenaires actifs, livraisons.', ar: 'لوحات تحكم تفاعلية بمؤشرات رئيسية: المبيعات، العمولات، الشركاء النشطون، التوصيلات.' },
    feat3_title:     { fr: 'Commissions Automatiques',    ar: 'عمولات تلقائية' },
    feat3_desc:      { fr: 'Calcul automatique des commissions multi-niveaux après chaque livraison validée. Transparent et instantané.', ar: 'حساب تلقائي للعمولات متعددة المستويات après chaque livraison validée. Transparent et instantané.' },
    feat4_title:     { fr: 'Gestion des Packs',           ar: 'إدارة الباقات' },
    feat4_desc:      { fr: '3 packs adaptés à chaque niveau — Starter, Silver, Gold. Débloquez des taux de commission croissants.', ar: '3 باقات مناسبة لكل مستوى — Starter، Silver، Gold. افتح معدلات عمولة متزايدة.' },
    feat5_title:     { fr: 'Rapports Financiers',         ar: 'التقارير المالية' },
    feat5_desc:      { fr: 'Export CSV, filtres par période, validation des commissions par le comptable. Gestion complète et sécurisée.', ar: 'تصدير CSV، فلاتر بالفترة، التحقق من العمولات بواسطة المحاسب. إدارة كاملة وآمنة.' },
    feat6_title:     { fr: 'Notifications Intelligentes', ar: 'إشعارات ذكية' },
    feat6_desc:      { fr: 'Alertes en temps réel pour chaque achat, validation de commission ou nouveau partenaire.', ar: 'تنبيهات فورية لكل عملية شراء، تحقق من عمولة، أو شريك جديد.' },
    how_tag:         { fr: 'Comment ça marche',           ar: 'كيف يعمل' },
    how_title:       { fr: '4 étapes pour démarrer',      ar: '4 خطوات للبدء' },
    step1_title:     { fr: 'Choisissez un pack',          ar: 'اختر باقة' },
    step1_desc:      { fr: 'Sélectionnez le pack qui correspond à votre ambition et activez votre niveau MLM.', ar: 'اختر الباقة التي تناسب طموحك وفعّل مستوى التسويق الشبكي.' },
    step2_title:     { fr: 'Créez votre compte',          ar: 'أنشئ حسابك' },
    step2_desc:      { fr: "Inscrivez-vous en 2 minutes et attendez la validation de l'administrateur.", ar: 'سجّل في دقيقتين وانتظر موافقة المدير.' },
    step3_title:     { fr: 'Invitez ou vendez',           ar: 'ادعُ أو بِع' },
    step3_desc:      { fr: 'Partagez votre code de parrainage et/ou vendez des produits de la boutique.', ar: 'شارك رمز إحالتك و/أو بع منتجات المتجر.' },
    step4_title:     { fr: 'Percevez vos commissions',    ar: 'احصل sur vos commissions' },
    step4_desc:      { fr: 'Suivez vos gains en temps réel et recevez vos commissions automatiquement.', ar: 'تابع أرباحك في الوقت الفعلي واستلم عمولاتك تلقائياً.' },
    packs_tag:       { fr: 'Nos Packs',                   ar: 'باقاتنا' },
    packs_title:     { fr: 'Commencez au niveau qui vous convient', ar: 'ابدأ بالمستوى المناسب لك' },
    packs_desc:      { fr: 'Cliquez sur un pack pour voir tous les détails et choisir le vôtre.', ar: 'انقر على باقة لرؤية التفاصيل واختيار باقتك.' },
    pack_popular:    { fr: 'Populaire',                   ar: 'الأكثر شعبية' },
    pack_payment:    { fr: 'Paiement unique',             ar: 'دفعة واحدة' },
    pack_detail:     { fr: 'Voir le détail',              ar: 'عرض التفاصيل' },
    boutique_tag:    { fr: 'Boutique',                    ar: 'المتجر' },
    boutique_f1_title: { fr: 'Catalogue produits',        ar: 'كتالوج المنتجات' },
    boutique_f1_desc:  { fr: "Parcourez une sélection de produits disponibles à l'achat via votre solde interne.", ar: 'استعرض مجموعة من المنتجات المتاحة للشراء عبر رصيدك الداخلي.' },
    boutique_f2_title: { fr: 'Commission à la vente',     ar: 'عمولة على البيع' },
    boutique_f2_desc:  { fr: 'Chaque produit vendu via votre réseau génère une commission créditée automatiquement.', ar: 'كل منتg يُباع عبر شبكتك يولّد عمولة تُضاف تلقائياً.' },
    boutique_f3_title: { fr: 'Avis & Reviews',            ar: 'آراء ومراجعات' },
    boutique_f3_desc:  { fr: "Laissez des avis sur les produits achetés et aidez votre réseau à faire les meilleurs choix.", ar: 'اترك آراءك حول المنتجات المشتراة وساعد شبكتك في اتخاذ القرارات.' },
    boutique_cta:    { fr: 'Découvrir la boutique',       ar: 'اكتشف المتجر' },
    ch_tag:          { fr: '🏆 Défis & Récompenses',      ar: '🏆 التحديات والجوائز' },
    ch_title:        { fr: 'Relevez nos défis,\ngagnez des récompenses !', ar: 'تحدَّ وارجح مكافآتك!' },
    ch_desc:         { fr: 'Participez aux challenges, progressez dans vos actions et débloquez des récompenses exclusives.', ar: 'شارك في التحديات وتقدّم في أعمالك وافتح مكافآت حصرية.' },
    ch_live:         { fr: 'En cours',                    ar: 'جارٍ' },
    ch_soon:         { fr: '⏳ Bientôt',                  ar: '⏳ قريباً' },
    ch_start:        { fr: '📅 Début :',                  ar: '📅 البداية :' },
    ch_end:          { fr: '⏰ Fin :',                    ar: '⏰ النهاية :' },
    ch_reward_lbl:   { fr: 'Récompense',                  ar: 'المكافأة' },
    ch_conditions:   { fr: 'Ce qu\'il faut accomplir',    ar: 'ما يجب إنجازه' },
    ch_objective:    { fr: 'Objectif : ×',                ar: 'الهدف : ×' },
    ch_participate:  { fr: 'Participer maintenant',       ar: 'شارك الآن' },
    ch_available:    { fr: 'Disponible le',               ar: 'متاح في' },
    ch_default_desc: { fr: 'Accomplissez les étapes ci-dessous pour remporter vos points et débloquer votre récompense.', ar: 'أنجز الخطوات أدناه لكسب نقاطك وفتح مكافأتك.' },
    testim_tag:      { fr: 'Témoignages',                 ar: 'آراء العملاء' },
    testim_title:    { fr: 'Ce que disent nos partenaires', ar: 'ما يقوله شركاؤنا' },
    testim1_text:    { fr: '« La plateforme a transformé ma manière de gérer mon réseau. Les commissions sont calculées automatiquement et je vois tout en temps réel. »', ar: '« المنصة غيّرت أسلوب إدارتي للشبكة. العمولات تُحسب تلقائياً وأرى كل شيء في الوقت الفعلي. »' },
    testim1_role:    { fr: 'Partenaire Gold · Niveau 3',  ar: 'شريك Gold · المستوى 3' },
    testim2_text:    { fr: '« Le tableau de bord Admin est une révolution. Je valide les commissions et j\'exporte mes rapports en un clic. »', ar: '« لوحة تحكم الإدارة ثورية. أُوافق على العمولات وأُصدّر تقاريري بنقرة واحدة. »' },
    testim2_role:    { fr: 'Superviseur · 48 partenaires', ar: 'مشرف · 48 شريكاً' },
    testim3_text:    { fr: '« J\'ai rejoint il y a 3 mois. Mon réseau a déjà 12 partenaires actifs et mes commissions augmentent chaque mois. »', ar: '« انضممت منذ 3 أشهر. شبكتي لديها بالفعل 12 شريكاً نشطاً وعمولاتي تزيد كل شهر. »' },
    testim3_role:    { fr: 'Partenaire Silver · Niveau 2', ar: 'شريك Silver · المستوى 2' },
    cta_create:      { fr: 'Créer mon compte',            ar: 'إنشاء حسابي' },
    cta_login:       { fr: 'Se connecter',                ar: 'تسجيل الدخول' },
    footer_platform: { fr: 'Plateforme',                  ar: 'المنصة' },
    footer_dashboard:{ fr: 'Dashboard',                   ar: 'لوحة التحكم' },
    footer_features: { fr: 'Fonctionnalités',             ar: 'الميزات' },
    footer_boutique: { fr: 'Boutique',                    ar: 'المتجر' },
    footer_packs:    { fr: 'Packs',                       ar: 'الباقات' },
    footer_account:  { fr: 'Compte',                      ar: 'الحساب' },
    footer_login:    { fr: 'Se connecter',                ar: 'تسجيل الدخول' },
    footer_register: { fr: "S'inscrire",                  ar: 'التسجيل' },
    footer_forgot:   { fr: 'Mot de passe oublié',         ar: 'نسيت كلمة المرور' },
    footer_support:  { fr: 'Support',                     ar: 'الدعم' },
    footer_how:      { fr: 'Comment ça marche',           ar: 'كيف يعمل' },
    footer_testim:   { fr: 'Témoignages',                 ar: 'آراء العملاء' },
    footer_contact:  { fr: 'Contact',                     ar: 'تواصل معنا' },
    footer_rights:   { fr: '© 2026 Cuteness Collaboration. Tous droits réservés.', ar: '© 2026 Cuteness Collaboration. جميع الحقوق محفوظة.' },
    footer_made:     { fr: 'Conçu avec ❤️ pour le marché tunisien', ar: 'صُمِّم بـ ❤️ للسوق التونسي' },
  };

  readonly CH_TYPE_LABELS: Record<string, string> = {
    PARRAINAGE: 'Parrainer un ami', COMMANDE: 'Passer une commande',
    COMMISSION: 'Générer une commission', FORMATION: 'Terminer une formation',
    ACHAT_PACK: 'Acheter un pack',
  };

  readonly CH_TYPE_LABELS_AR: Record<string, string> = {
    PARRAINAGE: 'إحالة صديق', COMMANDE: 'تقديم طلب',
    COMMISSION: 'توليد عمولة', FORMATION: 'إنهاء تكوين',
    ACHAT_PACK: 'شراء باقة',
  };

  getCHTypeLabel(type: string): string {
    return this.lang === 'ar'
      ? (this.CH_TYPE_LABELS_AR[type] ?? type)
      : (this.CH_TYPE_LABELS[type] ?? type);
  }

  readonly CH_TYPE_ICONS: Record<string, string> = {
    PARRAINAGE: '👥', COMMANDE: '🛒', COMMISSION: '💰',
    FORMATION: '🎓', ACHAT_PACK: '📦',
  };

  apiPacks: any[] = [
    { id: 0, nom: 'Starter', nomAr: 'ستارتر', emoji: '🥉', prix: 99,
      featuresFr: 'Accès à la plateforme|Code parrainage unique|5% de commission directe|Support email',
      featuresAr: 'الوصول إلى المنصة|رمز إحالة فريد|5% عمولة مباشرة|دعم البريد الإلكتروني',
      sousPacks: [
        { nom: 'Cosmétique', emoji: '💄' }, { nom: 'Parfum', emoji: '🌸' },
        { nom: 'Montre',     emoji: '⌚' }, { nom: 'Mix',    emoji: '🎁' }
      ]},
    { id: 0, nom: 'Silver', nomAr: 'سيلفر', emoji: '🥈', prix: 249,
      featuresFr: 'Tout Starter inclus|10% commission niveau 1|3% commission niveau 2|Formations vidéo|Support prioritaire',
      featuresAr: 'كل مزايا Starter|10% عمولة المستوى 1|3% عمولة المستوى 2|تكوينات بالفيديو|دعم ذو أولوية',
      sousPacks: [
        { nom: 'Cosmétique', emoji: '✨' }, { nom: 'Parfum', emoji: '💐' },
        { nom: 'Montre',     emoji: '🕰️'}, { nom: 'Mix',    emoji: '🎀' }
      ]},
    { id: 0, nom: 'Gold', nomAr: 'غولد', emoji: '🥇', prix: 499,
      featuresFr: 'Tout Silver inclus|15% commission niveau 1|5% niveau 2 · 2% niveau 3|Analytics avancés|Support dédié 24/7',
      featuresAr: 'كل مزايا Silver|15% عمولة المستوى 1|5% المستوى 2 · 2% المستوى 3|تحليلات متقدمة|دعم مخصص 24/7',
      sousPacks: [
        { nom: 'Cosmétique', emoji: '👑' }, { nom: 'Parfum', emoji: '💎' },
        { nom: 'Montre',     emoji: '🏆' }, { nom: 'Mix',    emoji: '🌟' }
      ]},
  ];

  heroBadge      = 'Plateforme MLM nouvelle génération';
  heroTitre      = 'Développez votre réseau, ensemble.';
  heroSousTitre  = 'Gérez vos partenaires, suivez vos commissions multi-niveaux et boostez votre activité MLM depuis une seule plateforme intuitive et puissante.';
  heroCtaPrimaire   = 'Commencer maintenant';
  heroCtaSecondaire = 'Voir la démo';
  heroImageUrl   = '';

  statsPartenaires = '248+';
  statsCommissions = '4 712 DT';
  statsLivraison   = '97%';
  statsCa          = '18 540 DT';

  bannerTexte  = '';
  bannerCouleur = '#FF6B5B';
  bannerLien   = '';
  bannerActif  = false;

  ctaTitre = 'Prêt à développer votre réseau ?';
  ctaDesc  = 'Rejoignez des centaines de partenaires qui développent déjà leur activité sur Cuteness Collaboration.';

  footerDesc      = 'La plateforme MLM nouvelle génération pour développer votre réseau de partenaires en Tunisie.';
  footerFacebook  = '';
  footerInstagram = '';
  footerLinkedin  = '';
  footerWhatsapp  = '';

  packStarterPrix = '99 DT';
  packStarterDesc = 'Accès à la plateforme|Code parrainage unique|5% de commission directe|Support email';
  packSilverPrix  = '249 DT';
  packSilverDesc  = 'Tout Starter inclus|10% commission niveau 1|3% commission niveau 2|Formations vidéo|Support prioritaire';
  packGoldPrix    = '499 DT';
  packGoldDesc    = 'Tout Silver inclus|15% commission niveau 1|5% niveau 2 · 2% niveau 3|Analytics avancés|Support dédié 24/7';

  boutiqueTitle    = 'Achetez et revendez nos produits';
  boutiqueSousTitre = 'Accédez à notre catalogue et générez des commissions sur chaque vente.';

  challengesActifs: any[] = [];

  ngOnInit(): void {
    this.contentService.loadAll().subscribe({
      next: () => this.applyContent(),
      error: () => {}
    });
    this.http.get<any[]>(`${environment.apiUrl}/packs`).subscribe({
      next: (packs) => { if (packs?.length) this.apiPacks = packs; },
      error: () => {}
    });
    this.http.get<any[]>(`${environment.apiUrl}/challenges`).subscribe({
      next: (data) => {
        this.challengesActifs = data ?? [];
        setTimeout(() => this.observeNewRevealElements(), 50);
      },
      error: () => {},
    });
  }

  guessPackId(nom: string): string {
    const l = (nom || '').toLowerCase();
    if (l.includes('starter')) return 'starter';
    if (l.includes('silver'))  return 'silver';
    if (l.includes('gold'))    return 'gold';
    return l;
  }

  isPopular(nom: string): boolean {
    return (nom || '').toLowerCase().includes('silver');
  }

  private applyContent(): void {
    const g = (s: string, k: string, d: string) => this.contentService.get(s, k, d);

    this.heroBadge         = g('hero', 'badge',          this.heroBadge);
    this.heroTitre         = g('hero', 'titre',          this.heroTitre);
    this.heroSousTitre     = g('hero', 'sous_titre',     this.heroSousTitre);
    this.heroCtaPrimaire   = g('hero', 'cta_primaire',   this.heroCtaPrimaire);
    this.heroCtaSecondaire = g('hero', 'cta_secondaire', this.heroCtaSecondaire);
    this.heroImageUrl      = g('hero', 'image_url',      '');

    this.statsPartenaires  = g('stats', 'partenaires', this.statsPartenaires);
    this.statsCommissions  = g('stats', 'commissions', this.statsCommissions);
    this.statsLivraison    = g('stats', 'livraison',   this.statsLivraison);
    this.statsCa           = g('stats', 'ca',          this.statsCa);

    this.bannerTexte       = g('banner_promo', 'texte',   '');
    this.bannerCouleur     = g('banner_promo', 'couleur', '#FF6B5B');
    this.bannerLien        = g('banner_promo', 'lien',    '');
    this.bannerActif       = g('banner_promo', 'actif',   'false') === 'true';

    this.ctaTitre          = g('cta', 'titre', this.ctaTitre);
    this.ctaDesc           = g('cta', 'desc',  this.ctaDesc);

    this.footerDesc        = g('footer', 'desc',      this.footerDesc);
    this.footerFacebook    = g('footer', 'facebook',  '');
    this.footerInstagram   = g('footer', 'instagram', '');
    this.footerLinkedin    = g('footer', 'linkedin',  '');
    this.footerWhatsapp    = g('footer', 'whatsapp',  '');

    this.packStarterPrix   = g('packs', 'starter_prix', this.packStarterPrix);
    this.packStarterDesc   = g('packs', 'starter_desc', this.packStarterDesc);
    this.packSilverPrix    = g('packs', 'silver_prix',  this.packSilverPrix);
    this.packSilverDesc    = g('packs', 'silver_desc',  this.packSilverDesc);
    this.packGoldPrix      = g('packs', 'gold_prix',    this.packGoldPrix);
    this.packGoldDesc      = g('packs', 'gold_desc',    this.packGoldDesc);

    this.boutiqueTitle     = g('boutique', 'titre_section', this.boutiqueTitle);
    this.boutiqueSousTitre = g('boutique', 'sous_titre',    this.boutiqueSousTitre);
  }

  splitDesc(desc: string): string[] {
    if (!desc) return [];
    const sep = desc.includes('|') ? '|' : ',';
    return desc.split(sep).map(s => s.trim()).filter(Boolean);
  }

  getImageUrl(url: string): string {
    if (!url) return '';
    return url.startsWith('http') ? url : `${environment.apiUrl.replace("/api", "")}${url}`;
  }

  private revealObserver!: IntersectionObserver;

  ngAfterViewInit(): void {
    this.revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add('visible'), i * 80);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => this.revealObserver.observe(el));
  }

  observeNewRevealElements(): void {
    if (!this.revealObserver) return;
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => this.revealObserver.observe(el));
  }

  scrollTo(event: Event, sectionId: string): void {
    event.preventDefault();
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  }

  goToPacks(): void {
    this.router.navigate(['/packs']);
  }

  choosePack(pack: any): void {
    if (pack?.id > 0) {
      this.router.navigate(['/packs', pack.id]);
    } else {
      this.router.navigate(['/packs'], { queryParams: { pack: this.guessPackId(pack?.nom ?? pack) } });
    }
  }
}
