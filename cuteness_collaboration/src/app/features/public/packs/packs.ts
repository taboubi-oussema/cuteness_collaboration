import { Component, OnInit, inject } from '@angular/core';
import { CommonModule }             from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { HttpClient }               from '@angular/common/http';
import { environment }              from '../../../../environments/environment';

interface SubPack {
  id:       string;
  apiId?:   number;
  name:     string;
  nameAr:   string;
  emoji:    string;
  theme:    string;
  products: string[];
  productsAr: string[];
}

interface Pack {
  id:           string;
  apiId?:       number;
  emoji:        string;
  name:         string;
  nameAr:       string;
  price:        number;
  color:        string;
  tagline:      string;
  taglineAr:    string;
  commission:   number;
  levels:       number;
  features:     string[];
  featuresAr:   string[];
  mlmTable:     { level: number; rate: string; labelFr: string; labelAr: string }[];
  advantagesFr: { icon: string; title: string; desc: string }[];
  advantagesAr: { icon: string; title: string; desc: string }[];
  subPacks:     SubPack[];
}

@Component({
  selector: 'app-packs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './packs.html',
  styleUrls: ['./packs.css']
})
export class PacksComponent implements OnInit {
  private http = inject(HttpClient);

  selectedPack:    string | null = null;
  selectedSubPack: string | null = null;
  lang: 'fr' | 'ar' = 'fr';
  packs: Pack[] = [];

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.packs = [...this.defaultPacks];
    this.loadFromApi();
    this.route.queryParams.subscribe(params => {
      const pack = params['pack'];
      if (pack) this.openPack(pack);
    });
  }

  private loadFromApi(): void {
    this.http.get<any[]>(`${environment.apiUrl}/packs`).subscribe({
      next: (apiPacks) => {
        if (!apiPacks?.length) return;
        this.packs = apiPacks.map(ap => {
          const localId = this.guessLocalId(ap.nom);
          const local   = this.defaultPacks.find(p => p.id === localId);

          const mlmTable: { level: number; rate: string; labelFr: string; labelAr: string }[] = [];
          if (ap.tauxCommissionDirect) mlmTable.push({ level: 1, rate: `${ap.tauxCommissionDirect}%`, labelFr: 'Niveau 1 (Direct)',        labelAr: 'المستوى 1 (مباشر)' });
          if (ap.niveaux >= 2 && ap.tauxCommissionNiveau2)  mlmTable.push({ level: 2, rate: `${ap.tauxCommissionNiveau2}%`,  labelFr: 'Niveau 2 (Indirect)',      labelAr: 'المستوى 2 (غير مباشر)' });
          if (ap.niveaux >= 3 && ap.tauxCommissionNiveau3)  mlmTable.push({ level: 3, rate: `${ap.tauxCommissionNiveau3}%`,  labelFr: 'Niveau 3 (Réseau étendu)', labelAr: 'المستوى 3 (الشبكة الموسعة)' });

          const features   = ap.featuresFr ? ap.featuresFr.split('|').map((s: string) => s.trim()).filter(Boolean) : (local?.features   ?? []);
          const featuresAr = ap.featuresAr ? ap.featuresAr.split('|').map((s: string) => s.trim()).filter(Boolean) : (local?.featuresAr ?? []);

          let advantagesFr = local?.advantagesFr ?? [];
          let advantagesAr = local?.advantagesAr ?? [];
          try { if (ap.advantagesFrJson) { const a = JSON.parse(ap.advantagesFrJson); if (a.length) advantagesFr = a; } } catch {}
          try { if (ap.advantagesArJson) { const a = JSON.parse(ap.advantagesArJson); if (a.length) advantagesAr = a; } } catch {}

          const subPacks: SubPack[] = ap.sousPacks?.length
            ? ap.sousPacks.map((sp: any, i: number) => ({
                id:         `${localId || ap.id}-sp-${i}`,
                apiId:      sp.id,
                name:       sp.nom    || local?.subPacks[i]?.name    || '',
                nameAr:     sp.nomAr  || local?.subPacks[i]?.nameAr  || '',
                emoji:      sp.emoji  || local?.subPacks[i]?.emoji   || '📦',
                theme:      sp.theme  || local?.subPacks[i]?.theme   || 'coral',
                products:   sp.produitsFr?.length ? sp.produitsFr  : (local?.subPacks[i]?.products   || []),
                productsAr: sp.produitsAr?.length ? sp.produitsAr  : (local?.subPacks[i]?.productsAr || []),
              }))
            : (local?.subPacks ?? []);

          return {
            id:           localId || `pack-${ap.id}`,
            apiId:        ap.id,
            emoji:        ap.emoji    || local?.emoji    || '📦',
            name:         ap.nom      || '',
            nameAr:       ap.nomAr    || '',
            price:        ap.prix     || 0,
            color:        ap.color    || local?.color    || 'coral',
            tagline:      ap.taglineFr || local?.tagline  || '',
            taglineAr:    ap.taglineAr || local?.taglineAr || '',
            commission:   ap.tauxCommissionDirect || 0,
            levels:       ap.niveaux  || 1,
            features,
            featuresAr,
            mlmTable:     mlmTable.length ? mlmTable : (local?.mlmTable ?? []),
            advantagesFr,
            advantagesAr,
            subPacks,
          } as Pack;
        });
      },
      error: () => {}
    });
  }

  private guessLocalId(nom: string): string {
    const lower = (nom || '').toLowerCase();
    if (lower.includes('starter')) return 'starter';
    if (lower.includes('silver'))  return 'silver';
    if (lower.includes('gold'))    return 'gold';
    return '';
  }

  private readonly defaultPacks: Pack[] = [
    {
      id: 'starter',
      emoji: '🥉',
      name: 'Starter',
      nameAr: 'ستارتر',
      price: 99,
      color: 'coral',
      tagline: 'Pour commencer votre aventure MLM',
      taglineAr: 'لبداية مسيرتك في التسويق الشبكي',
      commission: 5,
      levels: 1,
      features: ['Accès plateforme', 'Code parrainage unique', 'Tableau de bord basique', 'Support email'],
      featuresAr: ['الوصول للمنصة', 'كود إحالة فريد', 'لوحة تحكم أساسية', 'دعم عبر البريد الإلكتروني'],
      mlmTable: [
        { level: 1, rate: '5%', labelFr: 'Niveau 1 (Direct)', labelAr: 'المستوى 1 (مباشر)' }
      ],
      advantagesFr: [
        { icon: 'fas fa-user-plus',    title: 'Parrainage direct', desc: 'Invitez des partenaires et suivez leur activité en temps réel.' },
        { icon: 'fas fa-chart-simple', title: 'Dashboard basique', desc: 'Suivez vos commissions et partenaires depuis une interface claire.' },
        { icon: 'fas fa-headset',      title: 'Support email',     desc: 'Réponse garantie sous 48h par notre équipe dédiée.' }
      ],
      advantagesAr: [
        { icon: 'fas fa-user-plus',    title: 'إحالة مباشرة',        desc: 'ادعُ شركاء وتابع نشاطهم في الوقت الفعلي.' },
        { icon: 'fas fa-chart-simple', title: 'لوحة تحكم أساسية',   desc: 'تابع عمولاتك وشركاءك من واجهة واضحة.' },
        { icon: 'fas fa-headset',      title: 'دعم بالبريد الإلكتروني', desc: 'رد مضمون خلال 48 ساعة.' }
      ],
      subPacks: [
        {
          id: 'starter-cosmetique',
          name: 'Starter Cosmétique',
          nameAr: 'ستارتر كوزميتيك',
          emoji: '💄',
          theme: 'coral',
          products: [
            '1 crème hydratante visage (50ml)',
            '1 sérum anti-âge (30ml)',
            '1 masque purifiant',
            '1 lotion tonique'
          ],
          productsAr: [
            'كريم مرطب للوجه (50ml)',
            'سيروم مضاد للشيخوخة (30ml)',
            'قناع منقّي',
            'لوسيون منشّط'
          ]
        },
        {
          id: 'starter-parfum',
          name: 'Starter Parfum',
          nameAr: 'ستارتر عطور',
          emoji: '🌸',
          theme: 'pink',
          products: [
            '1 eau de parfum 50ml',
            '1 déodorant spray 150ml',
            '1 lotion corps parfumée',
            '1 savon de luxe'
          ],
          productsAr: [
            'عطر 50ml',
            'مزيل عرق سبراي 150ml',
            'لوسيون جسم معطّر',
            'صابون فاخر'
          ]
        },
        {
          id: 'starter-montre',
          name: 'Starter Montre',
          nameAr: 'ستارتر ساعات',
          emoji: '⌚',
          theme: 'blue',
          products: [
            '1 montre classique acier',
            '1 bracelet de rechange',
            '1 écrin de présentation',
            '1 chiffon de nettoyage'
          ],
          productsAr: [
            'ساعة كلاسيكية من الفولاذ',
            'سوار احتياطي',
            'علبة عرض أنيقة',
            'قماش تنظيف'
          ]
        },
        {
          id: 'starter-mix',
          name: 'Starter Mix',
          nameAr: 'ستارتر ميكس',
          emoji: '🎁',
          theme: 'mint',
          products: [
            '1 crème hydratante visage',
            '1 eau de parfum 30ml',
            '1 montre fashion',
            '1 pochette cadeau'
          ],
          productsAr: [
            'كريم مرطب للوجه',
            'عطر 30ml',
            'ساعة فاشون',
            'حقيبة هدايا'
          ]
        }
      ]
    },
    {
      id: 'silver',
      emoji: '🥈',
      name: 'Silver',
      nameAr: 'سيلفر',
      price: 249,
      color: 'blue',
      tagline: 'Pour développer un réseau solide',
      taglineAr: 'لبناء شبكة قوية ومتينة',
      commission: 10,
      levels: 2,
      features: ['Tout Starter inclus', 'Réseau 2 niveaux', '10% de commission', 'Formations vidéo', 'Support prioritaire'],
      featuresAr: ['كل مزايا ستارتر', 'شبكة من مستويين', 'عمولة 10%', 'تدريبات فيديو', 'دعم ذو أولوية'],
      mlmTable: [
        { level: 1, rate: '10%', labelFr: 'Niveau 1 (Direct)',   labelAr: 'المستوى 1 (مباشر)' },
        { level: 2, rate: '3%',  labelFr: 'Niveau 2 (Indirect)', labelAr: 'المستوى 2 (غير مباشر)' }
      ],
      advantagesFr: [
        { icon: 'fas fa-sitemap',        title: 'Réseau 2 niveaux',   desc: 'Commissions sur vos filleuls directs (10%) et leurs filleuls (3%).' },
        { icon: 'fas fa-graduation-cap', title: 'Formations vidéo',   desc: 'Accédez à notre bibliothèque de formations MLM.' },
        { icon: 'fas fa-star',           title: 'Support prioritaire', desc: 'Réponse sous 24h par un conseiller Senior.' }
      ],
      advantagesAr: [
        { icon: 'fas fa-sitemap',        title: 'شبكة من مستويين',  desc: 'عمولات من إحالاتك المباشرة (10%) ومن إحالاتهم (3%).' },
        { icon: 'fas fa-graduation-cap', title: 'تدريبات فيديو',    desc: 'استفد من مكتبة التدريبات.' },
        { icon: 'fas fa-star',           title: 'دعم ذو أولوية',    desc: 'رد خلال 24 ساعة.' }
      ],
      subPacks: [
        {
          id: 'silver-cosmetique',
          name: 'Silver Cosmétique',
          nameAr: 'سيلفر كوزميتيك',
          emoji: '✨',
          theme: 'coral',
          products: [
            '1 coffret soin visage complet',
            '1 sérum vitamine C (50ml)',
            '1 crème nuit régénérante',
            '1 contour des yeux',
            '1 gommage doux corps',
            '1 huile corporelle premium'
          ],
          productsAr: [
            'طقم عناية كامل بالوجه',
            'سيروم فيتامين C (50ml)',
            'كريم ليلي مجدد',
            'كريم حول العينين',
            'تقشير ناعم للجسم',
            'زيت جسم فاخر'
          ]
        },
        {
          id: 'silver-parfum',
          name: 'Silver Parfum',
          nameAr: 'سيلفر عطور',
          emoji: '💐',
          theme: 'pink',
          products: [
            '2 eaux de parfum 50ml (mixte)',
            '1 déodorant premium 200ml',
            '1 body lotion luxe 200ml',
            '1 gel douche parfumé',
            '1 coffret cadeau luxe'
          ],
          productsAr: [
            'عطران 50ml (مختلطان)',
            'مزيل عرق بريميوم 200ml',
            'لوسيون جسم فاخر 200ml',
            'جل استحمام معطّر',
            'علبة هدايا فاخرة'
          ]
        },
        {
          id: 'silver-montre',
          name: 'Silver Montre',
          nameAr: 'سيلفر ساعات',
          emoji: '🕰️',
          theme: 'blue',
          products: [
            '1 montre homme/femme premium',
            '2 bracelets interchangeables',
            '1 écrin de luxe',
            '1 garantie 1 an',
            '1 pochette transport'
          ],
          productsAr: [
            'ساعة رجالية/نسائية بريميوم',
            'سواران قابلان للتبادل',
            'علبة فاخرة',
            'ضمان لمدة سنة',
            'حقيبة نقل'
          ]
        },
        {
          id: 'silver-mix',
          name: 'Silver Mix',
          nameAr: 'سيلفر ميكس',
          emoji: '🎀',
          theme: 'mint',
          products: [
            '1 coffret soin visage (3 produits)',
            '1 eau de parfum 50ml',
            '1 montre fashion premium',
            '1 body lotion 150ml',
            '1 coffret cadeau élégant'
          ],
          productsAr: [
            'طقم عناية بالوجه (3 منتجات)',
            'عطر 50ml',
            'ساعة فاشون بريميوم',
            'لوسيون جسم 150ml',
            'علبة هدايا أنيقة'
          ]
        }
      ]
    },
    {
      id: 'gold',
      emoji: '🥇',
      name: 'Gold',
      nameAr: 'غولد',
      price: 499,
      color: 'gold',
      tagline: 'Pour les leaders qui visent haut',
      taglineAr: 'للقادة الطموحين الذين يستهدفون القمة',
      commission: 15,
      levels: 3,
      features: ['Tout Silver inclus', 'Réseau 3 niveaux', '15% commission', 'Analytics avancés', 'Support 24/7', 'Badge Gold'],
      featuresAr: ['كل مزايا سيلفر', 'شبكة 3 مستويات', 'عمولة 15%', 'تحليلات متقدمة', 'دعم 24/7', 'شارة غولد'],
      mlmTable: [
        { level: 1, rate: '15%', labelFr: 'Niveau 1 (Direct)',        labelAr: 'المستوى 1 (مباشر)' },
        { level: 2, rate: '5%',  labelFr: 'Niveau 2 (Indirect)',      labelAr: 'المستوى 2 (غير مباشر)' },
        { level: 3, rate: '2%',  labelFr: 'Niveau 3 (Réseau étendu)', labelAr: 'المستوى 3 (الشبكة الموسعة)' }
      ],
      advantagesFr: [
        { icon: 'fas fa-crown',        title: 'Badge Gold',         desc: 'Affichez votre statut premium et boostez la confiance.' },
        { icon: 'fas fa-chart-line',   title: 'Analytics avancés', desc: 'Rapports détaillés, export CSV, prévisions de revenus.' },
        { icon: 'fas fa-phone-volume', title: 'Support 24/7',       desc: 'Conseiller personnel disponible à tout moment.' }
      ],
      advantagesAr: [
        { icon: 'fas fa-crown',        title: 'شارة غولد',       desc: 'أظهر وضعك المتميز وعزّز ثقة شركائك.' },
        { icon: 'fas fa-chart-line',   title: 'تحليلات متقدمة', desc: 'تقارير مفصّلة، تصدير CSV، توقعات الدخل.' },
        { icon: 'fas fa-phone-volume', title: 'دعم 24/7',         desc: 'مستشار شخصي متاح في أي وقت.' }
      ],
      subPacks: [
        {
          id: 'gold-cosmetique',
          name: 'Gold Cosmétique',
          nameAr: 'غولد كوزميتيك',
          emoji: '👑',
          theme: 'coral',
          products: [
            '1 coffret soin premium complet (6 produits)',
            '1 sérum acide hyaluronique 50ml',
            '1 crème jour SPF50 premium',
            '1 crème nuit régénérante luxe',
            '1 masque or 24 carats',
            '1 huile visage précieuse',
            '1 contour yeux anti-âge',
            '1 gommage corps exfoliant'
          ],
          productsAr: [
            'طقم عناية بريميوم كامل (6 منتجات)',
            'سيروم حمض الهيالورونيك 50ml',
            'كريم نهاري SPF50 فاخر',
            'كريم ليلي مجدد فاخر',
            'قناع ذهب 24 قيراط',
            'زيت وجه ثمين',
            'كريم حول العينين مضاد للشيخوخة',
            'تقشير جسم مقشّر'
          ]
        },
        {
          id: 'gold-parfum',
          name: 'Gold Parfum',
          nameAr: 'غولد عطور',
          emoji: '💎',
          theme: 'pink',
          products: [
            '2 eaux de parfum 100ml collection exclusive',
            '1 parfum oud 30ml',
            '1 déodorant luxe 200ml',
            '1 body lotion or 250ml',
            '1 savon de hammam luxe',
            '1 coffret cadeau premium gravé'
          ],
          productsAr: [
            'عطران 100ml من المجموعة الحصرية',
            'عطر عود 30ml',
            'مزيل عرق فاخر 200ml',
            'لوسيون جسم ذهبي 250ml',
            'صابون حمام فاخر',
            'علبة هدايا بريميوم منقوشة'
          ]
        },
        {
          id: 'gold-montre',
          name: 'Gold Montre',
          nameAr: 'غولد ساعات',
          emoji: '🏆',
          theme: 'blue',
          products: [
            '1 montre de luxe acier doré',
            '1 montre fashion tendance',
            '3 bracelets interchangeables',
            '1 écrin de voyage luxe',
            '1 garantie 2 ans',
            '1 service entretien offert'
          ],
          productsAr: [
            'ساعة فاخرة من الفولاذ الذهبي',
            'ساعة فاشون عصرية',
            '3 أساور قابلة للتبديل',
            'علبة سفر فاخرة',
            'ضمان سنتين',
            'خدمة صيانة مجانية'
          ]
        },
        {
          id: 'gold-mix',
          name: 'Gold Mix',
          nameAr: 'غولد ميكس',
          emoji: '🌟',
          theme: 'mint',
          products: [
            '1 coffret soin visage premium (4 produits)',
            '1 eau de parfum 100ml exclusive',
            '1 montre de luxe acier',
            '1 body lotion or 200ml',
            '1 parfum oud 30ml',
            '1 coffret cadeau luxe gravé'
          ],
          productsAr: [
            'طقم عناية بالوجه بريميوم (4 منتجات)',
            'عطر 100ml حصري',
            'ساعة فاخرة من الفولاذ',
            'لوسيون جسم ذهبي 200ml',
            'عطر عود 30ml',
            'علبة هدايا فاخرة منقوشة'
          ]
        }
      ]
    }
  ];

  get activePack(): Pack | null {
    return this.packs.find(p => p.id === this.selectedPack) ?? null;
  }

  get activeSubPack(): SubPack | null {
    return this.activePack?.subPacks.find(s => s.id === this.selectedSubPack) ?? null;
  }

  openPack(id: string) {
    this.selectedPack    = id;
    this.selectedSubPack = null;
    this.lang = 'fr';
    setTimeout(() => document.getElementById('pack-detail')?.scrollIntoView({ behavior: 'smooth' }), 80);
  }

  closePack() {
    this.selectedPack    = null;
    this.selectedSubPack = null;
  }

  openSubPack(id: string) {
    this.selectedSubPack = this.selectedSubPack === id ? null : id;
  }

  choosePack(packId: string, subPackId?: string) {
    const pack = this.packs.find(p => p.id === packId);

    if (subPackId && pack?.apiId) {
      const sp = pack.subPacks.find(s => s.id === subPackId);
      if (sp?.apiId) {
        this.router.navigate(['/packs', pack.apiId, 'sous-packs', sp.apiId]);
        return;
      }
    }

    if (pack?.apiId) {
      this.router.navigate(['/packs', pack.apiId]);
      return;
    }

    this.router.navigate(['/packs'], { queryParams: { pack: packId } });
  }
}