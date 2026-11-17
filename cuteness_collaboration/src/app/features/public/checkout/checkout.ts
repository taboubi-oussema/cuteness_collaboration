import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../core/services/cart.service';
import { CommandeService } from '../../../core/services/commande.service';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css'],
})
export class CheckoutComponent implements OnInit {
  cartService       = inject(CartService);
  private cmd       = inject(CommandeService);
  private auth      = inject(AuthService);
  private dashboard = inject(DashboardService);
  private router    = inject(Router);

  adresse      = '';
  gouvernerat  = '';
  ville        = '';
  localite     = '';
  modePaiement: 'EN_LIGNE' | 'CARTE' = 'EN_LIGNE';
  optionRemise: 'IMMEDIATE' | 'REMBOURSEMENT' = 'IMMEDIATE';

  submitting    = false;
  error         = '';
  tauxReduction = 0;
  nomPartenaire = '';
  telephone     = '';
  region        = '';

  readonly TUNISIE: Record<string, string[]> = {
    'Ariana':        ['Ariana Ville', 'Ettadhamen', 'Kalâat el-Andalous', 'La Soukra', 'Mnihla', 'Raoued', 'Sidi Thabet'],
    'Béja':          ['Béja Nord', 'Béja Sud', 'Amdoun', 'Goubellat', 'Medjez el-Bab', 'Nefza', 'Testour', 'Thibar', 'Téboursouk'],
    'Ben Arous':     ['Ben Arous', 'Bou Mhel el-Bassatine', 'El Mourouj', 'Ezzahra', 'Fouchana', 'Hammam Chott', 'Hammam Lif', 'Mégrine', 'Mohamedia', 'Mornag', 'Nouvelle Médina', 'Radès'],
    'Bizerte':       ['Bizerte Nord', 'Bizerte Sud', 'El Alia', 'Ghezala', 'Ghar el-Melh', 'Joumine', 'Mateur', 'Menzel Bourguiba', 'Menzel Jemil', 'Ras Jebel', 'Sejnane', 'Tinja', 'Utique'],
    'Gabès':         ['Gabès Médina', 'Gabès Ouest', 'Gabès Sud', 'El Hamma', 'Ghannouch', 'Kettana', 'Mareth', 'Matmata', 'Menzel El Habib', 'Metouia', 'Nouvelle Matmata', 'Ouedhref'],
    'Gafsa':         ['Gafsa Nord', 'Gafsa Sud', 'Belkhir', 'El Guettar', 'El Ksar', 'Mdhilla', 'Métlaoui', 'Moularès', 'Redeyef', 'Sened', 'Sidi Aïch'],
    'Jendouba':      ['Jendouba', 'Aïn Draham', 'Balta-Bou Aouane', 'Bou Salem', 'Fernana', 'Ghardimaou', 'Oued Mliz', 'Tabarka'],
    'Kairouan':      ['Kairouan Nord', 'Kairouan Sud', 'Bouhajla', 'Chébika', 'Cherarda', 'El Alaa', 'Haffouz', 'Hajeb El Aïoun', 'Nasrallah', 'Oueslatia', 'Sbikha'],
    'Kasserine':     ['Kasserine Nord', 'Kasserine Sud', 'Aïn Jloula', 'El Ayoun', 'Fériana', 'Foussana', 'Hassi El Frid', 'Hidra', 'Majel Bel Abbès', 'Sbeitla', 'Sbiba', 'Thala'],
    'Kébili':        ['Kébili Nord', 'Kébili Sud', 'Douz Nord', 'Douz Sud', 'Faouar', 'Souk Lahad'],
    'Kef':           ['El Kef Ouest', 'El Kef Est', 'El Ksour', 'Jerissa', 'Kalaât Senan', 'Kalaât Khasba', 'Nebeur', 'Sers', 'Sakiet Sidi Youssef', 'Tajerouine'],
    'Mahdia':        ['Mahdia', 'Bou Merdes', 'Chorbane', 'El Bradaa', 'Essouassi', 'Hebira', 'Kerker', 'La Chebba', 'Melloulèche', 'Ouled Chamekh', 'Sidi Alouane'],
    'Manouba':       ['Manouba', 'Borj El Amri', 'Den Den', 'Djedeida', 'El Battan', 'Mornaguia', 'Oued Ellil', 'Tébourba'],
    'Médenine':      ['Médenine Nord', 'Médenine Sud', 'Ben Gardane', 'Beni Khedache', 'Djerba Ajim', 'Djerba Houmt Souk', 'Djerba Midoun', 'Sidi Makhlouf', 'Zarzis'],
    'Monastir':      ['Monastir', 'Bembla', 'Beni Hassen', 'Jammel', 'Ksar Hellal', 'Ksibet el-Médiouni', 'Moknine', 'Ouerdanine', 'Sahline', 'Sayada-Lamta-Bou Hajar', 'Téboulba', 'Zeramdine'],
    'Nabeul':        ['Nabeul', 'Beni Khiar', 'Bou Argoub', 'Dar Chaâbane El Fehri', 'El Haouaria', 'El Maamoura', 'Grombalia', 'Hammamet', 'Kelibia', 'Korba', 'Menzel Bouzelfa', 'Menzel Temime', 'Soliman', 'Takelsa'],
    'Sfax':          ['Sfax Médina', 'Sfax Ouest', 'Sfax Sud', 'Agareb', 'Bir Ali Ben Khalifa', 'Djebeniana', 'El Amra', 'El Hencha', 'Ghraïba', 'Jebiniana', 'Kerkennah', 'Mahres', 'Menzel Chaker', 'Sakiet Eddaïer', 'Sakiet Ezzit', 'Skhira', 'Thyna'],
    'Sidi Bouzid':   ['Sidi Bouzid Est', 'Sidi Bouzid Ouest', 'Ben Oun', 'Bir El Hafey', 'Cebbala Ouled Asker', 'Jelma', 'Jilma', 'Maknassy', 'Meknassy', 'Mezzouna', 'Ouled Haffouz', 'Regueb', 'Souk Jedid'],
    'Siliana':       ['Siliana Nord', 'Siliana Sud', 'Bargou', 'Bou Arada', 'El Aroussa', 'El Krib', 'Gaâfour', 'Kesra', 'Makthar', 'Rohia', 'Sidi Bou Rouis'],
    'Sousse':        ['Sousse Médina', 'Sousse Riadh', 'Sousse Jawhara', 'Akouda', 'Bouficha', 'Enfidha', 'Hammam Sousse', 'Hergla', 'Kalâa Kebira', 'Kalâa Seghira', 'Kondar', 'Ksar Hellal', 'M\'saken', 'Sidi Bou Ali', 'Sidi El Hani'],
    'Tataouine':     ['Tataouine Nord', 'Tataouine Sud', 'Bir Lahmar', 'Dhehiba', 'Ghomrassen', 'Remada', 'Smâr'],
    'Tozeur':        ['Tozeur', 'Degache', 'Hazoua', 'Nefta', 'Tameghza'],
    'Tunis':         ['Tunis', 'El Kabaria', 'El Menzah', 'El Omrane', 'El Omrane Supérieur', 'El Ouardia', 'Essijoumi', 'Ettahrir', 'Ezzouhour', 'La Goulette', 'La Marsa', 'Le Bardo', 'Le Kram', 'Séjoumi'],
    'Zaghouan':      ['Zaghouan', 'Bir Mcherga', 'El Fahs', 'Nadhour', 'Saouaf', 'Zriba'],
  };

  get gouvernerats(): string[] { return Object.keys(this.TUNISIE).sort(); }
  get villes(): string[] { return this.TUNISIE[this.gouvernerat] ?? []; }

  onGouverneratChange(): void { this.ville = ''; this.localite = ''; }
  onVilleChange(): void { this.localite = ''; }

  readonly LIVRAISON = 9;

  ngOnInit(): void {
    if (this.cartService.items.length === 0) {
      this.router.navigate(['/boutique']);
      return;
    }
    this.dashboard.getPartnerDashboard().subscribe({
      next: (data) => {
        this.tauxReduction = data.tauxReduction ?? 0;
        this.nomPartenaire = data.nom ?? '';
        this.telephone     = data.telephone ?? '';
        this.region        = data.region ?? '';
      },
      error: () => {},
    });
  }

  get subtotal(): number {
    return this.cartService.subtotal();
  }

  get remise(): number {
    if (this.optionRemise !== 'IMMEDIATE' || this.tauxReduction === 0) return 0;
    return Math.round(this.subtotal * (this.tauxReduction / 100) * 100) / 100;
  }

  get total(): number {
    return Math.round((this.subtotal - this.remise + this.LIVRAISON) * 100) / 100;
  }

  get remiseRembours(): number {
    if (this.optionRemise !== 'REMBOURSEMENT' || this.tauxReduction === 0) return 0;
    return Math.round(this.subtotal * (this.tauxReduction / 100) * 100) / 100;
  }

  removeItem(produitId: number): void {
    this.cartService.remove(produitId);
    if (this.cartService.items.length === 0) {
      this.router.navigate(['/boutique']);
    }
  }

  commander(): void {
    if (!this.nomPartenaire.trim()) { this.error = 'Veuillez saisir votre nom complet.'; return; }
    if (!this.telephone.trim()) { this.error = 'Veuillez saisir votre numéro de téléphone.'; return; }
    if (!this.gouvernerat) { this.error = 'Veuillez sélectionner un gouvernorat.'; return; }
    if (!this.ville) { this.error = 'Veuillez sélectionner une ville.'; return; }
    this.error = '';
    this.submitting = true;

    const body = {
      adresse: this.adresse.trim(),
      gouvernerat: this.gouvernerat,
      ville: this.ville,
      localite: this.localite.trim(),
      modePaiement: this.modePaiement,
      optionRemise: this.optionRemise,
      lignes: this.cartService.items.map(i => ({ produitId: i.produitId, quantite: i.qty })),
    };

    this.cmd.passerCommande(body).subscribe({
      next: () => {
        this.cartService.clear();
        this.router.navigate(['/checkout/success']);
      },
      error: (err) => {
        this.submitting = false;
        this.error = err?.error?.message ?? 'Erreur lors de la commande. Veuillez réessayer.';
      },
    });
  }
}
