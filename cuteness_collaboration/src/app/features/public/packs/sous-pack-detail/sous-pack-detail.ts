import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

interface SousPack {
  id: number;
  nom: string;
  nomAr: string;
  emoji: string;
  theme: string;
  produitsFr: string[];
  produitsAr: string[];
  imageUrl?: string;
  ordre: number;
}

interface Pack {
  id: number;
  nom: string;
  nomAr: string;
  description: string;
  prix: number;
  emoji: string;
  color: string;
  niveaux: number;
  tauxCommissionDirect: number;
  taglineFr: string;
  taglineAr: string;
  sousPacks: SousPack[];
  images: string[];
  featuresFr: string;
  featuresAr: string;
  tauxCommissionNiveau2: number;
  tauxCommissionNiveau3: number;
  tauxReduction: number;
  advantagesFrJson: string;
  advantagesArJson: string;
}

@Component({
  selector: 'app-sous-pack-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './sous-pack-detail.html',
  styleUrls: ['./sous-pack-detail.css'],
})
export class SousPackDetailComponent implements OnInit {
  private http        = inject(HttpClient);
  private route       = inject(ActivatedRoute);
  private router      = inject(Router);
  private authService = inject(AuthService);

  pack:     Pack | null     = null;
  sousPack: SousPack | null = null;
  isLoading     = true;
  lang: 'fr' | 'ar' = 'fr';
  currentImgIndex = 0;

  isPartenaire = false;

  showOrderModal = false;
  orderLoading   = false;
  orderError     = '';
  orderSuccess   = false;
  tauxReduction  = 0;

  orderForm = {
    adresse:      '',
    gouvernerat:  '',
    ville:        '',
    localite:     '',
    modePaiement: 'ESPECES',
    optionRemise: 'IMMEDIATE',
  };

  readonly TUNISIE: Record<string, string[]> = {
    'Ariana':      ['Ariana Ville','Ettadhamen','Kalâat el-Andalous','La Soukra','Mnihla','Raoued','Sidi Thabet'],
    'Béja':        ['Béja Nord','Béja Sud','Amdoun','Goubellat','Medjez el-Bab','Nefza','Testour','Thibar','Téboursouk'],
    'Ben Arous':   ['Ben Arous','Bou Mhel el-Bassatine','El Mourouj','Ezzahra','Fouchana','Hammam Chott','Hammam Lif','Mégrine','Mohamedia','Mornag','Nouvelle Médina','Radès'],
    'Bizerte':     ['Bizerte Nord','Bizerte Sud','El Alia','Ghezala','Ghar el-Melh','Joumine','Mateur','Menzel Bourguiba','Menzel Jemil','Ras Jebel','Sejnane','Tinja','Utique'],
    'Gabès':       ['Gabès Médina','Gabès Ouest','Gabès Sud','El Hamma','Ghannouch','Kettana','Mareth','Matmata','Menzel El Habib','Metouia','Nouvelle Matmata','Ouedhref'],
    'Gafsa':       ['Gafsa Nord','Gafsa Sud','Belkhir','El Guettar','El Ksar','Mdhilla','Métlaoui','Moularès','Redeyef','Sened','Sidi Aïch'],
    'Jendouba':    ['Jendouba','Aïn Draham','Balta-Bou Aouane','Bou Salem','Fernana','Ghardimaou','Oued Mliz','Tabarka'],
    'Kairouan':    ['Kairouan Nord','Kairouan Sud','Bouhajla','Chébika','Cherarda','El Alaa','Haffouz','Hajeb El Aïoun','Nasrallah','Oueslatia','Sbikha'],
    'Kasserine':   ['Kasserine Nord','Kasserine Sud','Aïn Jloula','El Ayoun','Fériana','Foussana','Hassi El Frid','Hidra','Majel Bel Abbès','Sbeitla','Sbiba','Thala'],
    'Kébili':      ['Kébili Nord','Kébili Sud','Douz Nord','Douz Sud','Faouar','Souk Lahad'],
    'Kef':         ['El Kef Ouest','El Kef Est','El Ksour','Jerissa','Kalaât Senan','Kalaât Khasba','Nebeur','Sers','Sakiet Sidi Youssef','Tajerouine'],
    'Mahdia':      ['Mahdia','Bou Merdes','Chorbane','El Bradaa','Essouassi','Hebira','Kerker','La Chebba','Melloulèche','Ouled Chamekh','Sidi Alouane'],
    'Manouba':     ['Manouba','Borj El Amri','Den Den','Djedeida','El Battan','Mornaguia','Oued Ellil','Tébourba'],
    'Médenine':    ['Médenine Nord','Médenine Sud','Ben Gardane','Beni Khedache','Djerba Ajim','Djerba Houmt Souk','Djerba Midoun','Sidi Makhlouf','Zarzis'],
    'Monastir':    ['Monastir','Bembla','Beni Hassen','Jammel','Ksar Hellal','Ksibet el-Médiouni','Moknine','Ouerdanine','Sahline','Sayada-Lamta-Bou Hajar','Téboulba','Zeramdine'],
    'Nabeul':      ['Nabeul','Beni Khiar','Bou Argoub','Dar Chaâbane El Fehri','El Haouaria','El Maamoura','Grombalia','Hammamet','Kelibia','Korba','Menzel Bouzelfa','Menzel Temime','Soliman','Takelsa'],
    'Sfax':        ['Sfax Médina','Sfax Ouest','Sfax Sud','Agareb','Bir Ali Ben Khalifa','Djebeniana','El Amra','El Hencha','Ghraïba','Jebiniana','Kerkennah','Mahres','Menzel Chaker','Sakiet Eddaïer','Sakiet Ezzit','Skhira','Thyna'],
    'Sidi Bouzid': ['Sidi Bouzid Est','Sidi Bouzid Ouest','Ben Oun','Bir El Hafey','Cebbala Ouled Asker','Jelma','Maknassy','Mezzouna','Ouled Haffouz','Regueb','Souk Jedid'],
    'Siliana':     ['Siliana Nord','Siliana Sud','Bargou','Bou Arada','El Aroussa','El Krib','Gaâfour','Kesra','Makthar','Rohia','Sidi Bou Rouis'],
    'Sousse':      ['Sousse Médina','Sousse Riadh','Sousse Jawhara','Akouda','Bouficha','Enfidha','Hammam Sousse','Hergla','Kalâa Kebira','Kalâa Seghira','Kondar','M\'saken','Sidi Bou Ali','Sidi El Hani'],
    'Tataouine':   ['Tataouine Nord','Tataouine Sud','Bir Lahmar','Dhehiba','Ghomrassen','Remada','Smâr'],
    'Tozeur':      ['Tozeur','Degache','Hazoua','Nefta','Tameghza'],
    'Tunis':       ['Tunis','El Kabaria','El Menzah','El Omrane','El Omrane Supérieur','El Ouardia','Essijoumi','Ettahrir','Ezzouhour','La Goulette','La Marsa','Le Bardo','Le Kram','Séjoumi'],
    'Zaghouan':    ['Zaghouan','Bir Mcherga','El Fahs','Nadhour','Saouaf','Zriba'],
  };

  get gouvernerats(): string[] { return Object.keys(this.TUNISIE).sort(); }
  get villes(): string[]       { return this.TUNISIE[this.orderForm.gouvernerat] ?? []; }

  onGouverneratChange(): void { this.orderForm.ville = ''; this.orderForm.localite = ''; }

  private readonly API      = `${environment.apiUrl}/packs`;
  private readonly CMD_API  = `${environment.apiUrl}/commandes`;
  private readonly DASH_API = `${environment.apiUrl}/dashboard/partner`;

  ngOnInit(): void {
    this.isPartenaire = this.authService.isPartenaire();

    if (this.isPartenaire) {
      this.http.get<any>(this.DASH_API).subscribe({
        next: (d) => { this.tauxReduction = d.tauxReduction ?? 0; },
        error: () => {},
      });
    }

    const packId    = this.route.snapshot.paramMap.get('packId');
    const subpackId = this.route.snapshot.paramMap.get('subpackId');
    if (!packId || !subpackId) { this.router.navigate(['/packs']); return; }

    this.http.get<Pack>(`${this.API}/${packId}`).subscribe({
      next: (data) => {
        this.pack     = data;
        this.sousPack = data.sousPacks.find(s => s.id === +subpackId) ?? null;
        this.isLoading = false;
        if (!this.sousPack) { this.router.navigate(['/packs', packId]); }
      },
      error: () => { this.isLoading = false; this.router.navigate(['/packs']); },
    });
  }

  openOrderModal(): void {
    this.orderError   = '';
    this.orderSuccess = false;
    this.orderForm    = { adresse: '', gouvernerat: '', ville: '', localite: '', modePaiement: 'ESPECES', optionRemise: 'IMMEDIATE' };
    this.showOrderModal = true;
  }

  closeOrderModal(): void {
    if (this.orderSuccess) {
      this.router.navigate(['/partner/dashboard']);
    }
    this.showOrderModal = false;
  }

  passerCommande(): void {
    if (!this.pack) return;
    if (!this.orderForm.gouvernerat) {
      this.orderError = 'Veuillez sélectionner un gouvernorat.'; return;
    }
    if (!this.orderForm.ville) {
      this.orderError = 'Veuillez sélectionner une ville.'; return;
    }
    this.orderLoading = true;
    this.orderError   = '';

    const body = {
      adresse:      this.orderForm.adresse,
      gouvernerat:  this.orderForm.gouvernerat,
      ville:        this.orderForm.ville || this.orderForm.gouvernerat,
      localite:     this.orderForm.localite,
      modePaiement: this.orderForm.modePaiement,
      optionRemise: this.orderForm.optionRemise,
      lignes: [{ packId: this.pack.id, quantite: 1 }],
    };

    this.http.post(this.CMD_API, body).subscribe({
      next: () => {
        this.orderLoading = false;
        this.orderSuccess = true;
      },
      error: (err) => {
        this.orderLoading = false;
        this.orderError = err?.error?.message ?? err?.error ?? 'Erreur lors de la commande.';
      },
    });
  }

  /** L'image du sous-pack est retournée en premier, suivie des images générales du pack. */
  get images(): string[] {
    if (!this.pack || !this.sousPack) return [];
    const imgs: string[] = [];
    if (this.sousPack.imageUrl) imgs.push(this.sousPack.imageUrl);
    (this.pack.images || []).forEach(img => {
      if (img !== this.sousPack!.imageUrl) imgs.push(img);
    });
    return imgs;
  }

  get products(): string[] {
    if (!this.sousPack) return [];
    if (this.lang === 'ar' && this.sousPack.produitsAr.length) return this.sousPack.produitsAr;
    return this.sousPack.produitsFr;
  }

  choisir(): void {
    if (!this.pack || !this.sousPack) return;
    const packKey = this.pack.nom.toLowerCase();
    const spKey   = packKey + '-' + this.sousPack.nom.toLowerCase().replace(/\s+/g, '-');
    this.router.navigate(['/auth/register'], { queryParams: { pack: packKey, subpack: spKey } });
  }

  getImageUrl(url: string): string {
    if (!url) return '';
    return url.startsWith('http') ? url : `${environment.apiUrl.replace("/api", "")}${url}`;
  }

  prevImg(): void {
    if (!this.images.length) return;
    this.currentImgIndex = (this.currentImgIndex - 1 + this.images.length) % this.images.length;
  }

  nextImg(): void {
    if (!this.images.length) return;
    this.currentImgIndex = (this.currentImgIndex + 1) % this.images.length;
  }

  themeGradient(): string {
    const map: Record<string, string> = {
      coral: 'linear-gradient(135deg,#FF6B5B,#FF9D78)',
      blue:  'linear-gradient(135deg,#2490bb,#3AAFD9)',
      mint:  'linear-gradient(135deg,#059669,#00C9A7)',
      pink:  'linear-gradient(135deg,#be185d,#F472B6)',
      gold:  'linear-gradient(135deg,#D97706,#FBBF24)',
    };
    return map[this.sousPack?.theme || 'coral'] ?? map['coral'];
  }

  themeColor(): string {
    const map: Record<string, string> = {
      coral: '#FF6B5B', blue: '#3AAFD9', mint: '#00C9A7', pink: '#F472B6', gold: '#F59E0B',
    };
    return map[this.sousPack?.theme || 'coral'] ?? '#FF6B5B';
  }
}
