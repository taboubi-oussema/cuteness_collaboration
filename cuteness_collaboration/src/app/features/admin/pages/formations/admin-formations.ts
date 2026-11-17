import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface Formation {
  id: number;
  titre: string;
  description: string;
  duree: string;
  niveau: string;
  videoUrl: string;
  accesRequis: string;
  imageUrl?: string;
  ordre: number;
}

@Component({
  selector: 'app-admin-formations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-formations.html',
  styleUrls: [
    '../../dashboard/Dashboard.component.css',
    '../../../comptable/dashboard/comptable-dashboard.css',
  ],
})
export class AdminFormationsComponent implements OnInit {
  private http = inject(HttpClient);

  private readonly API        = `${environment.apiUrl}/formations`;
  private readonly UPLOAD_API = `${environment.apiUrl}/upload`;

  formations: Formation[] = [];
  isLoading = false;
  errorMsg  = '';
  successMsg = '';

  showForm  = false;
  editMode  = false;
  formData: Partial<Formation> = {};
  imagePreview: string | null = null;
  uploadingImage = false;

  readonly ACCES_OPTIONS = [
    { value: 'TOUS',    label: '🌍 Tout le monde (y compris non-partenaires)' },
    { value: 'STARTER', label: '🎯 Partenaires (tous packs)' },
    { value: 'SILVER',  label: '🥈 Pack Silver & Gold' },
    { value: 'GOLD',    label: '⭐ Pack Gold uniquement' },
  ];

  readonly NIVEAU_OPTIONS = ['Débutant', 'Intermédiaire', 'Avancé'];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.http.get<Formation[]>(this.API).subscribe({
      next: (data) => { this.formations = data; this.isLoading = false; },
      error: () => { this.errorMsg = 'Impossible de charger les formations.'; this.isLoading = false; },
    });
  }

  openAdd(): void {
    this.showForm  = true;
    this.editMode  = false;
    this.formData  = { accesRequis: 'TOUS', niveau: 'Débutant', ordre: this.formations.length };
    this.imagePreview = null;
    this.errorMsg = '';
    this.successMsg = '';
  }

  openEdit(f: Formation): void {
    this.showForm  = true;
    this.editMode  = true;
    this.formData  = { ...f };
    this.imagePreview = f.imageUrl ? this.getImageUrl(f.imageUrl) : null;
    this.errorMsg = '';
    this.successMsg = '';
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const fd = new FormData();
    fd.append('file', input.files[0]);
    this.uploadingImage = true;
    this.http.post<{ url: string }>(this.UPLOAD_API, fd).subscribe({
      next: (res) => { this.formData.imageUrl = res.url; this.imagePreview = this.getImageUrl(res.url); this.uploadingImage = false; },
      error: () => { this.errorMsg = "Erreur upload image."; this.uploadingImage = false; },
    });
  }

  removeImage(): void { this.formData.imageUrl = undefined; this.imagePreview = null; }

  save(): void {
    this.isLoading = true;
    const req$ = this.editMode
      ? this.http.put<Formation>(`${this.API}/${this.formData.id}`, this.formData)
      : this.http.post<Formation>(this.API, this.formData);
    req$.subscribe({
      next: () => { this.successMsg = this.editMode ? 'Formation modifiée.' : 'Formation créée.'; this.showForm = false; this.load(); },
      error: () => { this.errorMsg = 'Erreur lors de la sauvegarde.'; this.isLoading = false; },
    });
  }

  delete(id: number): void {
    if (!confirm('Supprimer cette formation ?')) return;
    this.isLoading = true;
    this.http.delete(`${this.API}/${id}`).subscribe({
      next: () => { this.successMsg = 'Formation supprimée.'; this.load(); },
      error: () => { this.errorMsg = 'Erreur lors de la suppression.'; this.isLoading = false; },
    });
  }

  getImageUrl(url: string | undefined): string {
    if (!url) return '';
    return url.startsWith('http') ? url : `${environment.apiUrl.replace("/api", "")}${url}`;
  }

  accesLabel(acces: string): string {
    return this.ACCES_OPTIONS.find(o => o.value === acces)?.label ?? acces;
  }

  accesColor(acces: string): string {
    switch (acces) {
      case 'GOLD':    return '#f59e0b';
      case 'SILVER':  return '#6b7280';
      case 'STARTER': return '#3b82f6';
      default:        return '#10b981';
    }
  }
}
