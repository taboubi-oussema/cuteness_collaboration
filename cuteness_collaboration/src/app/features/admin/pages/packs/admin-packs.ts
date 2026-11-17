import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface SousPack {
  id?: number;
  nom: string;
  nomAr: string;
  emoji: string;
  theme: string;
  produitsFr: string[];
  produitsAr: string[];
  imageUrl?: string;
  images: string[];
  ordre: number;
  stock: number;
  // editing state
  _produitsFrRaw?: string;
  _produitsArRaw?: string;
}

interface Pack {
  id: number;
  nom: string;
  nomAr: string;
  description: string;
  prix: number;
  tauxCommissionDirect: number;
  tauxCommissionNiveau2: number;
  tauxCommissionNiveau3: number;
  tauxReduction: number;
  emoji: string;
  color: string;
  niveaux: number;
  imageUrl?: string;
  taglineFr: string;
  taglineAr: string;
  featuresFr: string;
  featuresAr: string;
  advantagesFrJson: string;
  advantagesArJson: string;
  sousPacks: SousPack[];
  images: string[];
}

@Component({
  selector: 'app-admin-packs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-packs.html',
  styleUrls: [
    '../../dashboard/Dashboard.component.css',
    '../../../comptable/dashboard/comptable-dashboard.css',
  ],
})
export class AdminPacksComponent implements OnInit {
  private http = inject(HttpClient);

  private readonly API        = `${environment.apiUrl}/packs`;
  private readonly UPLOAD_API = `${environment.apiUrl}/upload`;

  packs: Pack[] = [];
  isLoading  = false;
  errorMsg   = '';
  successMsg = '';

  // ── which pack panel is open ──
  openPackId: number | null = null;

  // ── edit basic info ──
  editingPack: Partial<Pack> | null = null;

  // ── sous-pack form ──
  spFormPackId: number | null = null;
  spEditId: number | null = null;
  spForm: Partial<SousPack> = {};

  // ── image upload ──
  uploadingFor = '';   // 'pack-{id}' | 'sp' | 'sp-gallery'
  spFormImages: string[] = [];

  ngOnInit(): void { this.loadPacks(); }

  loadPacks(): void {
    this.isLoading = true;
    this.http.get<Pack[]>(this.API).subscribe({
      next: (data) => { this.packs = data; this.isLoading = false; },
      error: () => { this.errorMsg = 'Impossible de charger les packs.'; this.isLoading = false; },
    });
  }

  // ── toggle expand ──
  togglePack(id: number): void {
    this.openPackId = this.openPackId === id ? null : id;
    this.editingPack  = null;
    this.spFormPackId = null;
  }

  // ── basic info ──
  startEdit(p: Pack): void {
    this.editingPack = { ...p };
    this.errorMsg  = '';
    this.successMsg = '';
  }

  cancelEdit(): void { this.editingPack = null; }

  savePackInfo(): void {
    if (!this.editingPack?.id) return;
    this.isLoading = true;
    this.http.put<Pack>(`${this.API}/${this.editingPack.id}`, this.editingPack).subscribe({
      next: () => { this.successMsg = 'Pack mis à jour.'; this.editingPack = null; this.loadPacks(); },
      error: () => { this.errorMsg = 'Erreur lors de la sauvegarde.'; this.isLoading = false; },
    });
  }

  // ── sous-pack CRUD ──
  openSpForm(packId: number, sp?: SousPack): void {
    this.spFormPackId = packId;
    this.errorMsg = '';
    if (sp) {
      this.spEditId = sp.id ?? null;
      this.spForm = {
        ...sp,
        _produitsFrRaw: (sp.produitsFr || []).join('|'),
        _produitsArRaw: (sp.produitsAr || []).join('|'),
      };
      this.spFormImages = [...(sp.images ?? [])];
    } else {
      this.spEditId = null;
      this.spForm = { nom: '', nomAr: '', emoji: '📦', theme: 'coral', _produitsFrRaw: '', _produitsArRaw: '', ordre: 0 };
      this.spFormImages = [];
    }
  }

  cancelSpForm(): void { this.spFormPackId = null; this.spEditId = null; }

  saveSousPack(): void {
    if (!this.spFormPackId) return;
    const payload = {
      nom:        this.spForm.nom,
      nomAr:      this.spForm.nomAr,
      emoji:      this.spForm.emoji,
      theme:      this.spForm.theme,
      produitsFr: this.spForm._produitsFrRaw,
      produitsAr: this.spForm._produitsArRaw,
      imageUrl:   this.spForm.imageUrl ?? null,
      ordre:      this.spForm.ordre ?? 0,
      stock:      this.spForm.stock ?? 0,
    };
    const req$ = this.spEditId
      ? this.http.put(`${this.API}/${this.spFormPackId}/sous-packs/${this.spEditId}`, payload)
      : this.http.post(`${this.API}/${this.spFormPackId}/sous-packs`, payload);

    req$.subscribe({
      next: () => { this.successMsg = 'Sous-pack sauvegardé.'; this.cancelSpForm(); this.loadPacks(); },
      error: () => { this.errorMsg = 'Erreur lors de la sauvegarde du sous-pack.'; },
    });
  }

  deleteSousPack(packId: number, spId: number): void {
    if (!confirm('Supprimer ce sous-pack ?')) return;
    this.http.delete(`${this.API}/${packId}/sous-packs/${spId}`).subscribe({
      next: () => { this.successMsg = 'Sous-pack supprimé.'; this.loadPacks(); },
      error: () => { this.errorMsg = 'Erreur lors de la suppression.'; },
    });
  }

  // ── sous-pack image upload ──
  onSpImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const fd = new FormData();
    fd.append('file', input.files[0]);
    this.uploadingFor = 'sp';
    this.http.post<{ url: string }>(this.UPLOAD_API, fd).subscribe({
      next: (res) => { this.spForm.imageUrl = res.url; this.uploadingFor = ''; },
      error: () => { this.errorMsg = 'Erreur upload image sous-pack.'; this.uploadingFor = ''; },
    });
    input.value = '';
  }

  removeSpImage(): void { this.spForm.imageUrl = undefined; }

  onSpGalleryUpload(event: Event): void {
    if (!this.spEditId || !this.spFormPackId) return;
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const fd = new FormData();
    fd.append('file', input.files[0]);
    input.value = '';
    this.uploadingFor = 'sp-gallery';
    this.http.post<{ url: string }>(this.UPLOAD_API, fd).subscribe({
      next: (res) => {
        this.http.post<string[]>(`${this.API}/${this.spFormPackId}/sous-packs/${this.spEditId}/images`, { imageUrl: res.url }).subscribe({
          next: (imgs) => { this.spFormImages = imgs; this.uploadingFor = ''; },
          error: () => { this.errorMsg = 'Erreur ajout image.'; this.uploadingFor = ''; },
        });
      },
      error: () => { this.errorMsg = 'Erreur upload.'; this.uploadingFor = ''; },
    });
  }

  deleteSpGalleryImage(url: string): void {
    if (!this.spEditId || !this.spFormPackId) return;
    this.http.post<string[]>(`${this.API}/${this.spFormPackId}/sous-packs/${this.spEditId}/images/delete-by-url`, { imageUrl: url }).subscribe({
      next: (imgs) => { this.spFormImages = imgs; },
      error: () => { this.errorMsg = 'Erreur suppression image.'; },
    });
  }

  // ── pack image upload ──
  onImageUpload(event: Event, packId: number): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const fd = new FormData();
    fd.append('file', input.files[0]);
    this.uploadingFor = `pack-${packId}`;
    this.http.post<{ url: string }>(this.UPLOAD_API, fd).subscribe({
      next: (res) => {
        this.http.post<string[]>(`${this.API}/${packId}/images`, { imageUrl: res.url }).subscribe({
          next: () => { this.uploadingFor = ''; this.loadPacks(); },
          error: () => { this.errorMsg = 'Erreur ajout image.'; this.uploadingFor = ''; },
        });
      },
      error: () => { this.errorMsg = 'Erreur upload.'; this.uploadingFor = ''; },
    });
    input.value = '';
  }

  deleteImage(packId: number, imgUrl: string): void {
    if (!confirm('Supprimer cette image ?')) return;
    this.http.post(`${this.API}/${packId}/images/delete-by-url`, { imageUrl: imgUrl }).subscribe({
      next: () => { this.successMsg = 'Image supprimée.'; this.loadPacks(); },
      error: () => { this.errorMsg = "Erreur lors de la suppression de l'image."; },
    });
  }

  getImageUrl(url: string | undefined): string {
    if (!url) return '';
    return url.startsWith('http') ? url : `${environment.apiUrl.replace('/api', '')}${url}`;
  }

  packColor(nom: string): string {
    const n = (nom || '').toLowerCase();
    if (n.includes('gold'))   return '#F59E0B';
    if (n.includes('silver')) return '#3AAFD9';
    return '#FF6B5B';
  }

  themeOptions = ['coral', 'blue', 'mint', 'pink', 'gold'];

  // ── create pack modal ──
  showCreateModal = false;
  creating = false;
  newPack: Partial<Pack> = {};

  openCreateModal(): void {
    this.newPack = {
      nom: '', nomAr: '', description: '', prix: 0,
      tauxCommissionDirect: 0, tauxCommissionNiveau2: 0, tauxCommissionNiveau3: 0,
      tauxReduction: 0, emoji: '📦', color: 'coral', niveaux: 1,
      taglineFr: '', taglineAr: '', featuresFr: '', featuresAr: '',
    };
    this.showCreateModal = true;
    this.errorMsg = '';
    this.successMsg = '';
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  createPack(): void {
    if (!this.newPack.nom?.trim()) {
      this.errorMsg = 'Le nom du pack est obligatoire.';
      return;
    }
    this.creating = true;
    this.http.post<Pack>(this.API, this.newPack).subscribe({
      next: () => {
        this.creating = false;
        this.showCreateModal = false;
        this.successMsg = `Pack "${this.newPack.nom}" créé avec succès.`;
        this.loadPacks();
      },
      error: (err) => {
        this.creating = false;
        this.errorMsg = err?.error?.message ?? 'Erreur lors de la création du pack.';
      },
    });
  }

  // ── delete pack ──
  deletingPackId: number | null = null;

  deletePack(id: number, nom: string): void {
    if (!confirm(`Supprimer le pack "${nom}" ? Cette action est irréversible.`)) return;
    this.deletingPackId = id;
    this.http.delete(`${this.API}/${id}`).subscribe({
      next: () => {
        this.packs = this.packs.filter(p => p.id !== id);
        this.deletingPackId = null;
        if (this.openPackId === id) this.openPackId = null;
        this.successMsg = `Pack "${nom}" supprimé.`;
      },
      error: (err) => {
        this.deletingPackId = null;
        this.errorMsg = err?.error?.message ?? 'Erreur lors de la suppression du pack.';
      },
    });
  }
}
