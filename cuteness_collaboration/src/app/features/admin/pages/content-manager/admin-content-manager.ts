import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ContentService } from '../../../../core/services/content.service';
import { PageContent } from '../../../../shared/models/content.model';
import { environment } from '../../../../../environments/environment';

type Tab = 'home' | 'packs' | 'boutique' | 'contact' | 'theme';

@Component({
  selector: 'app-admin-content-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-content-manager.html',
  styleUrls: [
    '../../dashboard/Dashboard.component.css',
    '../../../comptable/dashboard/comptable-dashboard.css',
  ],
})
export class AdminContentManagerComponent implements OnInit {
  private contentService = inject(ContentService);
  private http = inject(HttpClient);
  private readonly UPLOAD_API = `${environment.apiUrl}/upload`;

  activeTab: Tab = 'home';
  isSaving = false;
  isLoading = true;
  successMsg = '';
  errorMsg   = '';
  uploadingKey = '';

  // ── Content model ──────────────────────────────────────
  hero = {
    badge:     'Plateforme MLM nouvelle génération',
    titre:     'Développez votre réseau, ensemble.',
    sousTitre: 'Gérez vos partenaires, suivez vos commissions multi-niveaux et boostez votre activité MLM depuis une seule plateforme intuitive et puissante.',
    ctaPrimaire: 'Commencer maintenant',
    ctaSecondaire: 'Voir la démo',
    imageUrl:  '',
  };

  stats = {
    partenaires: '248+',
    commissions: '4 712 DT',
    livraison:   '97%',
    ca:          '18 540 DT',
  };

  bannerPromo = {
    texte:  '',
    couleur: '#FF6B5B',
    lien:   '',
    actif:  'false',
  };

  cta = {
    titre: 'Prêt à développer votre réseau ?',
    desc:  'Rejoignez des centaines de partenaires qui développent déjà leur activité sur Cuteness Collaboration.',
  };

  footer = {
    desc:      'La plateforme MLM nouvelle génération pour développer votre réseau de partenaires en Tunisie.',
    facebook:  '',
    instagram: '',
    linkedin:  '',
    whatsapp:  '',
  };

  packs = {
    starter_prix: '99 DT',
    starter_desc: 'Accès à la plateforme, code parrainage, 5% de commission, support email.',
    silver_prix:  '249 DT',
    silver_desc:  'Tout Starter inclus, 10% de commission, réseau 2 niveaux, formations incluses.',
    gold_prix:    '499 DT',
    gold_desc:    'Tout Silver inclus, 15% de commission, réseau 3 niveaux, analytics avancés.',
  };

  boutique = {
    banniere_texte:  '',
    banniere_couleur: '#FF6B5B',
    banniere_actif:  'false',
    titre_section:   'Achetez et revendez nos produits',
    sous_titre:      'Accédez à notre catalogue et générez des commissions sur chaque vente.',
  };

  contact = {
    email:     'contact@cuteness.tn',
    telephone: '',
    adresse:   '',
    horaires:  '',
    facebook:  '',
    instagram: '',
    linkedin:  '',
    whatsapp:  '',
  };

  theme = {
    couleur_principale: '#FF6B5B',
    couleur_secondaire: '#3AAFD9',
    couleur_accent:     '#00C9A7',
    couleur_gold:       '#F59E0B',
  };

  ngOnInit(): void {
    this.contentService.loadAll().subscribe({
      next: () => { this.applyLoaded(); this.isLoading = false; },
      error: () => { this.isLoading = false; },
    });
  }

  private applyLoaded(): void {
    const g = (s: string, k: string, d: string) => this.contentService.get(s, k, d);

    this.hero.badge          = g('hero', 'badge', this.hero.badge);
    this.hero.titre          = g('hero', 'titre', this.hero.titre);
    this.hero.sousTitre      = g('hero', 'sous_titre', this.hero.sousTitre);
    this.hero.ctaPrimaire    = g('hero', 'cta_primaire', this.hero.ctaPrimaire);
    this.hero.ctaSecondaire  = g('hero', 'cta_secondaire', this.hero.ctaSecondaire);
    this.hero.imageUrl       = g('hero', 'image_url', '');

    this.stats.partenaires   = g('stats', 'partenaires', this.stats.partenaires);
    this.stats.commissions   = g('stats', 'commissions', this.stats.commissions);
    this.stats.livraison     = g('stats', 'livraison', this.stats.livraison);
    this.stats.ca            = g('stats', 'ca', this.stats.ca);

    this.bannerPromo.texte   = g('banner_promo', 'texte', '');
    this.bannerPromo.couleur = g('banner_promo', 'couleur', '#FF6B5B');
    this.bannerPromo.lien    = g('banner_promo', 'lien', '');
    this.bannerPromo.actif   = g('banner_promo', 'actif', 'false');

    this.cta.titre           = g('cta', 'titre', this.cta.titre);
    this.cta.desc            = g('cta', 'desc', this.cta.desc);

    this.footer.desc         = g('footer', 'desc', this.footer.desc);
    this.footer.facebook     = g('footer', 'facebook', '');
    this.footer.instagram    = g('footer', 'instagram', '');
    this.footer.linkedin     = g('footer', 'linkedin', '');
    this.footer.whatsapp     = g('footer', 'whatsapp', '');

    this.packs.starter_prix  = g('packs', 'starter_prix', this.packs.starter_prix);
    this.packs.starter_desc  = g('packs', 'starter_desc', this.packs.starter_desc);
    this.packs.silver_prix   = g('packs', 'silver_prix', this.packs.silver_prix);
    this.packs.silver_desc   = g('packs', 'silver_desc', this.packs.silver_desc);
    this.packs.gold_prix     = g('packs', 'gold_prix', this.packs.gold_prix);
    this.packs.gold_desc     = g('packs', 'gold_desc', this.packs.gold_desc);

    this.boutique.banniere_texte   = g('boutique', 'banniere_texte', '');
    this.boutique.banniere_couleur = g('boutique', 'banniere_couleur', '#FF6B5B');
    this.boutique.banniere_actif   = g('boutique', 'banniere_actif', 'false');
    this.boutique.titre_section    = g('boutique', 'titre_section', this.boutique.titre_section);
    this.boutique.sous_titre       = g('boutique', 'sous_titre', this.boutique.sous_titre);

    this.contact.email     = g('contact', 'email', this.contact.email);
    this.contact.telephone = g('contact', 'telephone', '');
    this.contact.adresse   = g('contact', 'adresse', '');
    this.contact.horaires  = g('contact', 'horaires', '');
    this.contact.facebook  = g('contact', 'facebook', '');
    this.contact.instagram = g('contact', 'instagram', '');
    this.contact.linkedin  = g('contact', 'linkedin', '');
    this.contact.whatsapp  = g('contact', 'whatsapp', '');

    this.theme.couleur_principale = g('theme', 'couleur_principale', this.theme.couleur_principale);
    this.theme.couleur_secondaire = g('theme', 'couleur_secondaire', this.theme.couleur_secondaire);
    this.theme.couleur_accent     = g('theme', 'couleur_accent', this.theme.couleur_accent);
    this.theme.couleur_gold       = g('theme', 'couleur_gold', this.theme.couleur_gold);
  }

  onImageUpload(event: Event, section: string, cle: string): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const fd = new FormData();
    fd.append('file', input.files[0]);
    this.uploadingKey = `${section}.${cle}`;
    this.http.post<{ url: string }>(this.UPLOAD_API, fd).subscribe({
      next: (res) => {
        if (section === 'hero' && cle === 'image_url') this.hero.imageUrl = res.url;
        this.uploadingKey = '';
      },
      error: () => { this.errorMsg = "Erreur upload."; this.uploadingKey = ''; },
    });
  }

  save(): void {
    this.isSaving = true;
    this.errorMsg = '';
    this.successMsg = '';

    const entries: PageContent[] = [
      // Hero
      { section:'hero', cle:'badge',          valeur: this.hero.badge,         type:'text' },
      { section:'hero', cle:'titre',           valeur: this.hero.titre,         type:'text' },
      { section:'hero', cle:'sous_titre',      valeur: this.hero.sousTitre,     type:'text' },
      { section:'hero', cle:'cta_primaire',    valeur: this.hero.ctaPrimaire,   type:'text' },
      { section:'hero', cle:'cta_secondaire',  valeur: this.hero.ctaSecondaire, type:'text' },
      { section:'hero', cle:'image_url',       valeur: this.hero.imageUrl,      type:'image' },
      // Stats
      { section:'stats', cle:'partenaires', valeur: this.stats.partenaires, type:'text' },
      { section:'stats', cle:'commissions', valeur: this.stats.commissions, type:'text' },
      { section:'stats', cle:'livraison',   valeur: this.stats.livraison,   type:'text' },
      { section:'stats', cle:'ca',          valeur: this.stats.ca,          type:'text' },
      // Banner promo
      { section:'banner_promo', cle:'texte',   valeur: this.bannerPromo.texte,   type:'text' },
      { section:'banner_promo', cle:'couleur', valeur: this.bannerPromo.couleur, type:'color' },
      { section:'banner_promo', cle:'lien',    valeur: this.bannerPromo.lien,    type:'text' },
      { section:'banner_promo', cle:'actif',   valeur: this.bannerPromo.actif,   type:'boolean' },
      // CTA
      { section:'cta', cle:'titre', valeur: this.cta.titre, type:'text' },
      { section:'cta', cle:'desc',  valeur: this.cta.desc,  type:'text' },
      // Footer
      { section:'footer', cle:'desc',      valeur: this.footer.desc,      type:'text' },
      { section:'footer', cle:'facebook',  valeur: this.footer.facebook,  type:'text' },
      { section:'footer', cle:'instagram', valeur: this.footer.instagram, type:'text' },
      { section:'footer', cle:'linkedin',  valeur: this.footer.linkedin,  type:'text' },
      { section:'footer', cle:'whatsapp',  valeur: this.footer.whatsapp,  type:'text' },
      // Packs
      { section:'packs', cle:'starter_prix', valeur: this.packs.starter_prix, type:'text' },
      { section:'packs', cle:'starter_desc', valeur: this.packs.starter_desc, type:'text' },
      { section:'packs', cle:'silver_prix',  valeur: this.packs.silver_prix,  type:'text' },
      { section:'packs', cle:'silver_desc',  valeur: this.packs.silver_desc,  type:'text' },
      { section:'packs', cle:'gold_prix',    valeur: this.packs.gold_prix,    type:'text' },
      { section:'packs', cle:'gold_desc',    valeur: this.packs.gold_desc,    type:'text' },
      // Boutique
      { section:'boutique', cle:'banniere_texte',   valeur: this.boutique.banniere_texte,   type:'text' },
      { section:'boutique', cle:'banniere_couleur', valeur: this.boutique.banniere_couleur, type:'color' },
      { section:'boutique', cle:'banniere_actif',   valeur: this.boutique.banniere_actif,   type:'boolean' },
      { section:'boutique', cle:'titre_section',    valeur: this.boutique.titre_section,    type:'text' },
      { section:'boutique', cle:'sous_titre',       valeur: this.boutique.sous_titre,       type:'text' },
      // Contact
      { section:'contact', cle:'email',     valeur: this.contact.email,     type:'text' },
      { section:'contact', cle:'telephone', valeur: this.contact.telephone, type:'text' },
      { section:'contact', cle:'adresse',   valeur: this.contact.adresse,   type:'text' },
      { section:'contact', cle:'horaires',  valeur: this.contact.horaires,  type:'text' },
      { section:'contact', cle:'facebook',  valeur: this.contact.facebook,  type:'text' },
      { section:'contact', cle:'instagram', valeur: this.contact.instagram, type:'text' },
      { section:'contact', cle:'linkedin',  valeur: this.contact.linkedin,  type:'text' },
      { section:'contact', cle:'whatsapp',  valeur: this.contact.whatsapp,  type:'text' },
      // Theme
      { section:'theme', cle:'couleur_principale', valeur: this.theme.couleur_principale, type:'color' },
      { section:'theme', cle:'couleur_secondaire', valeur: this.theme.couleur_secondaire, type:'color' },
      { section:'theme', cle:'couleur_accent',     valeur: this.theme.couleur_accent,     type:'color' },
      { section:'theme', cle:'couleur_gold',       valeur: this.theme.couleur_gold,       type:'color' },
    ];

    this.contentService.saveAll(entries).subscribe({
      next: () => { this.successMsg = 'Contenu sauvegardé avec succès !'; this.isSaving = false; },
      error: () => { this.errorMsg = 'Erreur lors de la sauvegarde.'; this.isSaving = false; },
    });
  }

  getImageUrl(url: string): string {
    if (!url) return '';
    return url.startsWith('http') ? url : `${environment.apiUrl.replace("/api", "")}${url}`;
  }
}
