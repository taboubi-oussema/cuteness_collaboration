import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface Categorie {
  id: number;
  nom: string;
  description: string;
  couleur: string;
  icone: string;
}

const ICONES_SUGGEREES = [
  { label: 'Homme',    classe: 'fas fa-male' },
  { label: 'Femme',    classe: 'fas fa-female' },
  { label: 'Enfant',   classe: 'fas fa-child' },
  { label: 'Bébé',     classe: 'fas fa-baby' },
  { label: 'Maison',   classe: 'fas fa-home' },
  { label: 'Beauté',   classe: 'fas fa-spa' },
  { label: 'Soin',     classe: 'fas fa-heart' },
  { label: 'Mode',     classe: 'fas fa-tshirt' },
  { label: 'Sport',    classe: 'fas fa-dumbbell' },
  { label: 'Tech',     classe: 'fas fa-laptop' },
  { label: 'Cuisine',  classe: 'fas fa-utensils' },
  { label: 'Cadeau',   classe: 'fas fa-gift' },
  { label: 'Soleil',   classe: 'fas fa-sun' },
  { label: 'Étoile',   classe: 'fas fa-star' },
  { label: 'Tag',      classe: 'fas fa-tag' },
];

interface Produit {
  id: number;
  nom: string;
  description: string;
  prix: number;
  stock: number;
  categorie?: Categorie;
  imageUrl?: string;
  bestSeller: boolean;
  enPromo: boolean;
  prixPromo?: number;
  cible?: string;
  images: string[];
}

@Component({
  selector: 'app-admin-boutique',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-boutique.html',
  styleUrls: [
    '../../dashboard/Dashboard.component.css',
    '../../../comptable/dashboard/comptable-dashboard.css',
  ],
})
export class AdminBoutiqueComponent implements OnInit {
  private http = inject(HttpClient);

  private readonly CAT_API    = `${environment.apiUrl}/categories`;
  private readonly PROD_API   = `${environment.apiUrl}/produits`;
  private readonly UPLOAD_API = `${environment.apiUrl}/upload`;

  // ── Tabs ──
  activeTab: 'categories' | 'produits' = 'categories';

  // ── Data ──
  categories: Categorie[] = [];
  produits: Produit[] = [];

  // ── State ──
  isLoadingCat  = false;
  isLoadingProd = false;
  errorMsg   = '';
  successMsg = '';

  // ── Categories form ──
  showFormCat  = false;
  editModeCat  = false;
  formCat: Partial<Categorie> = {};
  readonly iconesSuggerees = ICONES_SUGGEREES;

  // ── Produits form ──
  showFormProd  = false;
  editModeProd  = false;
  formProd: Partial<Produit & { categorieId?: number }> = {};

  // ── Image upload ──
  uploadingImage   = false;
  imagePreview: string | null = null;
  formProdImages: string[] = [];
  uploadingGallery = false;

  // ── Search ──
  recherche = '';

  get produitsFiltres(): Produit[] {
    if (!this.recherche.trim()) return this.produits;
    const q = this.recherche.toLowerCase();
    return this.produits.filter(p => p.nom.toLowerCase().includes(q));
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadProduits();
  }

  // ── Categories CRUD ──

  loadCategories(): void {
    this.isLoadingCat = true;
    this.http.get<Categorie[]>(this.CAT_API).subscribe({
      next: (data) => { this.categories = data; this.isLoadingCat = false; },
      error: () => { this.errorMsg = 'Impossible de charger les catégories.'; this.isLoadingCat = false; },
    });
  }

  openAddCat(): void {
    this.showFormCat = true;
    this.editModeCat = false;
    this.formCat = { couleur: '#3AAFDA', icone: '' };
    this.errorMsg = '';
    this.successMsg = '';
  }

  openEditCat(c: Categorie): void {
    this.showFormCat = true;
    this.editModeCat = true;
    this.formCat = { ...c };
    this.errorMsg = '';
    this.successMsg = '';
  }

  saveCat(): void {
    this.isLoadingCat = true;
    this.errorMsg = '';
    this.successMsg = '';

    const req$ = this.editModeCat
      ? this.http.put<Categorie>(`${this.CAT_API}/${this.formCat.id}`, this.formCat)
      : this.http.post<Categorie>(this.CAT_API, this.formCat);

    req$.subscribe({
      next: () => {
        this.successMsg = this.editModeCat ? 'Catégorie modifiée.' : 'Catégorie créée.';
        this.showFormCat = false;
        this.loadCategories();
      },
      error: (e: HttpErrorResponse) => { this.errorMsg = `Erreur ${e.status} : ${e.error?.message ?? 'Sauvegarde catégorie impossible.'}`; this.isLoadingCat = false; },
    });
  }

  deleteCat(id: number): void {
    if (!confirm('Supprimer cette catégorie ?')) return;
    this.isLoadingCat = true;
    this.http.delete(`${this.CAT_API}/${id}`).subscribe({
      next: () => { this.successMsg = 'Catégorie supprimée.'; this.loadCategories(); },
      error: (e: HttpErrorResponse) => { this.errorMsg = `Erreur ${e.status} : ${e.error?.message ?? 'Suppression impossible.'}`; this.isLoadingCat = false; },
    });
  }

  countProduitsForCat(catId: number): number {
    return this.produits.filter(p => p.categorie?.id === catId).length;
  }

  // ── Produits CRUD ──

  loadProduits(): void {
    this.isLoadingProd = true;
    this.http.get<Produit[]>(this.PROD_API).subscribe({
      next: (data) => { this.produits = data; this.isLoadingProd = false; },
      error: () => { this.errorMsg = 'Impossible de charger les articles.'; this.isLoadingProd = false; },
    });
  }

  openAddProd(): void {
    this.showFormProd = true;
    this.editModeProd = false;
    this.formProd = {};
    this.imagePreview = null;
    this.formProdImages = [];
    this.errorMsg = '';
    this.successMsg = '';
  }

  openEditProd(p: Produit): void {
    this.showFormProd = true;
    this.editModeProd = true;
    this.formProd = { ...p, categorieId: p.categorie?.id, bestSeller: p.bestSeller, enPromo: p.enPromo, prixPromo: p.prixPromo, cible: p.cible };
    this.imagePreview = p.imageUrl ? this.getImageUrl(p.imageUrl) : null;
    this.formProdImages = [...(p.images ?? [])];
    this.errorMsg = '';
    this.successMsg = '';
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];

    const fd = new FormData();
    fd.append('file', file);

    this.uploadingImage = true;
    this.http.post<{ url: string }>(this.UPLOAD_API, fd).subscribe({
      next: (res) => {
        this.formProd.imageUrl = res.url;
        this.imagePreview = this.getImageUrl(res.url);
        this.uploadingImage = false;
      },
      error: (e: HttpErrorResponse) => {
        this.errorMsg = `Erreur upload ${e.status} : ${e.error?.message ?? 'Upload image impossible.'}`;
        this.uploadingImage = false;
      },
    });
  }

  removeImage(): void {
    this.formProd.imageUrl = undefined;
    this.imagePreview = null;
  }

  onGalleryFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const fd = new FormData();
    fd.append('file', input.files[0]);
    input.value = '';
    this.uploadingGallery = true;
    this.http.post<{ url: string }>(this.UPLOAD_API, fd).subscribe({
      next: (res) => {
        if (this.editModeProd && this.formProd.id) {
          this.http.post<string[]>(`${this.PROD_API}/${this.formProd.id}/images`, { imageUrl: res.url }).subscribe({
            next: (imgs) => { this.formProdImages = imgs; this.uploadingGallery = false; },
            error: () => { this.errorMsg = 'Erreur ajout image galerie.'; this.uploadingGallery = false; },
          });
        } else {
          this.formProdImages = [...this.formProdImages, res.url];
          this.uploadingGallery = false;
        }
      },
      error: (e: HttpErrorResponse) => {
        this.errorMsg = `Erreur upload ${e.status}.`;
        this.uploadingGallery = false;
      },
    });
  }

  deleteGalleryImage(url: string): void {
    if (!this.editModeProd || !this.formProd.id) {
      this.formProdImages = this.formProdImages.filter(u => u !== url);
      return;
    }
    this.http.post<string[]>(`${this.PROD_API}/${this.formProd.id}/images/delete-by-url`, { imageUrl: url }).subscribe({
      next: (imgs) => { this.formProdImages = imgs; },
      error: () => { this.errorMsg = 'Erreur suppression image.'; },
    });
  }

  saveProd(): void {
    this.isLoadingProd = true;
    this.errorMsg = '';
    this.successMsg = '';

    const payload = {
      nom:         this.formProd.nom,
      description: this.formProd.description,
      prix:        this.formProd.prix,
      stock:       this.formProd.stock,
      categorieId: this.formProd.categorieId,
      imageUrl:    this.formProd.imageUrl,
      bestSeller:  !!this.formProd.bestSeller,
      enPromo:     !!this.formProd.enPromo,
      prixPromo:   this.formProd.enPromo ? this.formProd.prixPromo : null,
      cible:       this.formProd.cible || null,
    };

    const req$ = this.editModeProd
      ? this.http.put<Produit>(`${this.PROD_API}/${this.formProd.id}`, payload)
      : this.http.post<Produit>(this.PROD_API, payload);

    req$.subscribe({
      next: () => {
        this.successMsg = this.editModeProd ? 'Article modifié.' : 'Article créé.';
        this.showFormProd = false;
        this.loadProduits();
      },
      error: (e: HttpErrorResponse) => { this.errorMsg = `Erreur ${e.status} : ${e.error?.message ?? "Sauvegarde article impossible."}`; this.isLoadingProd = false; },
    });
  }

  deleteProd(id: number): void {
    if (!confirm('Supprimer cet article ?')) return;
    this.isLoadingProd = true;
    this.http.delete(`${this.PROD_API}/${id}`).subscribe({
      next: () => { this.successMsg = 'Article supprimé.'; this.loadProduits(); },
      error: (e: HttpErrorResponse) => { this.errorMsg = `Erreur ${e.status} : ${e.error?.message ?? 'Suppression impossible.'}`; this.isLoadingProd = false; },
    });
  }

  getImageUrl(url: string | undefined): string {
    if (!url) return '';
    return url.startsWith('http') ? url : `${environment.apiUrl.replace('/api', '')}${url}`;
  }
}
