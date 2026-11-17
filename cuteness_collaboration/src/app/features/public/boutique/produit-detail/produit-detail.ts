import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../../core/services/cart.service';
import { environment } from '../../../../../environments/environment';

interface Categorie {
  id: number;
  nom: string;
  couleur: string;
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
  images: string[];
  categorie: Categorie | null;
}

interface Avis {
  id: number;
  contenu: string;
  imageUrl: string | null;
  dateCreation: string;
  auteurNom: string;
  userId: number;
}

@Component({
  selector: 'app-produit-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './produit-detail.html',
  styleUrls: ['./produit-detail.css'],
})
export class ProduitDetailComponent implements OnInit {
  private http        = inject(HttpClient);
  private route       = inject(ActivatedRoute);
  private router      = inject(Router);
  private authService = inject(AuthService);
  cartService         = inject(CartService);

  private readonly BASE     = environment.apiUrl.replace('/api', '');
  private readonly API_BASE = environment.apiUrl;

  produit: Produit | null = null;
  avis: Avis[] = [];
  isLoading    = true;
  loadError    = '';
  activeImg    = 0;

  isAuthenticated = false;

  newContenu  = '';
  newImageUrl = '';
  uploadingImg = false;
  submitting   = false;
  submitSuccess = false;
  submitError   = '';

  selectedImageFile: File | null = null;
  imagePreview: string | null    = null;

  addedToCart    = false;
  showCartToast  = false;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProduit(id);
    this.loadAvis(id);
  }

  loadProduit(id: number): void {
    this.http.get<Produit>(`${this.API_BASE}/produits/${id}`).subscribe({
      next: (p) => { this.produit = p; this.isLoading = false; },
      error: () => { this.isLoading = false; this.loadError = 'Impossible de charger ce produit. Veuillez réessayer.'; },
    });
  }

  loadAvis(id: number): void {
    this.http.get<Avis[]>(`${this.API_BASE}/produits/${id}/avis`).subscribe({
      next: (data) => { this.avis = data; },
      error: () => {},
    });
  }

  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.selectedImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => { this.imagePreview = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  submitAvis(): void {
    if (!this.newContenu.trim() && !this.selectedImageFile) return;
    this.submitting   = true;
    this.submitError  = '';
    this.submitSuccess = false;

    if (this.selectedImageFile) {
      const fd = new FormData();
      fd.append('file', this.selectedImageFile);
      this.uploadingImg = true;
      this.http.post<{ url: string }>(`${this.API_BASE}/upload`, fd).subscribe({
        next: (res) => {
          this.uploadingImg = false;
          this.newImageUrl  = res.url;
          this.postAvis();
        },
        error: (err: HttpErrorResponse) => {
          this.uploadingImg = false;
          this.submitting   = false;
          this.submitError  = `Erreur upload image (${err.status}).`;
        },
      });
    } else {
      this.postAvis();
    }
  }

  private postAvis(): void {
    const id = this.produit!.id;
    this.http.post<Avis>(`${this.API_BASE}/produits/${id}/avis`, {
      contenu: this.newContenu,
      imageUrl: this.newImageUrl || null,
    }).subscribe({
      next: (a) => {
        this.avis.unshift(a);
        this.newContenu       = '';
        this.newImageUrl      = '';
        this.selectedImageFile = null;
        this.imagePreview     = null;
        this.submitting       = false;
        this.submitSuccess    = true;
        setTimeout(() => { this.submitSuccess = false; }, 3500);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting  = false;
        this.submitError = `Erreur ${err.status} : ${err.error?.message ?? err.message}`;
      },
    });
  }

  deleteAvis(avisId: number): void {
    this.http.delete(`${this.API_BASE}/produits/avis/${avisId}`).subscribe({
      next: () => { this.avis = this.avis.filter(a => a.id !== avisId); },
      error: () => {},
    });
  }

  get galleryImages(): string[] {
    if (!this.produit) return [];
    const imgs = this.produit.images ?? [];
    return imgs.length > 0 ? imgs : (this.produit.imageUrl ? [this.produit.imageUrl] : []);
  }

  prevImg(): void {
    this.activeImg = (this.activeImg - 1 + this.galleryImages.length) % this.galleryImages.length;
  }

  nextImg(): void {
    this.activeImg = (this.activeImg + 1) % this.galleryImages.length;
  }

  isAdmin(): boolean {
    return this.authService.isAdmin() || this.authService.isSuperviseur();
  }

  getImageUrl(url: string | undefined | null): string {
    if (!url) return '';
    return url.startsWith('http') ? url : `${this.BASE}${url}`;
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  }

  private addProduitToCart(): void {
    if (!this.produit) return;
    const p = this.produit;
    this.cartService.add({
      produitId: p.id,
      nom: p.nom,
      prix: p.enPromo && p.prixPromo != null ? p.prixPromo : p.prix,
      prixOriginal: p.prix,
      imageUrl: p.imageUrl ?? null,
    });
  }

  addToCart(): void {
    this.addProduitToCart();
    this.addedToCart = true;
    setTimeout(() => { this.addedToCart = false; }, 2500);
    this.showCartToast = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.showCartToast = false; }, 25000);
  }

  commanderDirect(): void {
    this.addProduitToCart();
    this.router.navigate(['/checkout']);
  }

  closeCartToast(navigate = false): void {
    this.showCartToast = false;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (navigate) this.router.navigate(['/checkout']);
  }

  goBack(): void {
    this.router.navigate(['/boutique']);
  }
}
