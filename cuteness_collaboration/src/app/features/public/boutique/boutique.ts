import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { environment } from '../../../../environments/environment';

interface Categorie {
  id: number;
  nom: string;
  couleur: string;
  icone: string;
}

interface Produit {
  id: number;
  nom: string;
  description: string;
  prix: number;
  prixPromo: number | null;
  enPromo: boolean;
  bestSeller: boolean;
  stock: number;
  imageUrl: string;
  categorie: Categorie | null;
  cible: string | null;
}

const CIBLES = [
  { value: 'tous',    label: 'Tous',   icon: 'fas fa-th-large' },
  { value: 'femme',   label: 'Femme',  icon: 'fas fa-female'   },
  { value: 'homme',   label: 'Homme',  icon: 'fas fa-male'     },
  { value: 'enfant',  label: 'Enfant', icon: 'fas fa-child'    },
  { value: 'maison',  label: 'Maison', icon: 'fas fa-home'     },
  { value: 'autre',   label: 'Autre',  icon: 'fas fa-star'     },
];

@Component({
  selector: 'app-boutique',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './boutique.html',
  styleUrls: ['./boutique.css'],
})
export class BoutiqueComponent implements OnInit {
  private http        = inject(HttpClient);
  private router      = inject(Router);
  private authService = inject(AuthService);
  cartService         = inject(CartService);

  private readonly API_PRODUITS   = `${environment.apiUrl}/produits`;
  private readonly API_CATEGORIES = `${environment.apiUrl}/categories`;

  produits:   Produit[]   = [];
  categories: Categorie[] = [];
  isLoading = true;

  recherche      = '';
  categorieId: number | null = null;
  cibleFilter    = 'tous';
  isAuthenticated = false;

  readonly cibles = CIBLES;

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.loadCategories();
    this.loadProduits();
  }

  loadCategories(): void {
    this.http.get<Categorie[]>(this.API_CATEGORIES).subscribe({
      next: (data) => { this.categories = data; },
      error: () => {},
    });
  }

  loadProduits(): void {
    this.isLoading = true;
    this.http.get<Produit[]>(this.API_PRODUITS).subscribe({
      next: (data) => { this.produits = data; this.isLoading = false; },
      error: () => { this.isLoading = false; },
    });
  }

  get filtered(): Produit[] {
    const q = this.recherche.trim().toLowerCase();
    return this.produits.filter(p => {
      const matchSearch = !q ||
        p.nom.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q);
      const matchCat   = this.categorieId === null || p.categorie?.id === this.categorieId;
      const matchCible = this.cibleFilter === 'tous' ||
        (p.cible ?? 'autre') === this.cibleFilter;
      return matchSearch && matchCat && matchCible && p.stock > 0;
    });
  }

  selectCategorie(id: number | null): void {
    this.categorieId = id;
  }

  goToDetail(id: number): void {
    this.router.navigate(['/boutique', id]);
  }

  prixAffiche(p: Produit): number {
    return p.enPromo && p.prixPromo != null ? p.prixPromo : p.prix;
  }

  getImageUrl(url: string | undefined): string {
    if (!url) return '';
    return url.startsWith('http') ? url : `${environment.apiUrl.replace('/api', '')}${url}`;
  }
}
