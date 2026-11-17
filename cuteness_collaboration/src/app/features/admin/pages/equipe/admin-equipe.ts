import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface MembreEquipe {
  id: number;
  nom: string;
  email: string;
  role: string;
  statut: boolean;
  dateCreation: string;
}

@Component({
  selector: 'app-admin-equipe',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-equipe.html',
  styleUrls: [
    '../../dashboard/Dashboard.component.css',
    '../../../comptable/dashboard/comptable-dashboard.css',
  ],
})
export class AdminEquipeComponent implements OnInit {
  private http = inject(HttpClient);

  membres: MembreEquipe[] = [];
  isLoading = true;
  successMsg = '';
  errorMsg = '';
  processingId: number | null = null;

  searchTerm = '';
  filtreRole: 'TOUS' | 'SUPERVISEUR' | 'COMPTABLE' = 'TOUS';

  // Modal edit
  showModal = false;
  editTarget: MembreEquipe | null = null;
  editNom = '';
  editEmail = '';
  editRole = '';
  saving = false;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.http.get<MembreEquipe[]>(`${environment.apiUrl}/admin/users`).subscribe({
      next: (data) => {
        this.membres = (data ?? []).filter(
          u => u.role === 'SUPERVISEUR' || u.role === 'COMPTABLE'
        );
        this.isLoading = false;
      },
      error: () => {
        this.errorMsg = 'Impossible de charger les membres de l\'équipe.';
        this.isLoading = false;
      },
    });
  }

  get membresFiltres(): MembreEquipe[] {
    return this.membres.filter(m => {
      const term = this.searchTerm.toLowerCase();
      const matchSearch = !term
        || m.nom?.toLowerCase().includes(term)
        || m.email?.toLowerCase().includes(term)
        || String(m.id).includes(term);
      const matchRole = this.filtreRole === 'TOUS' || m.role === this.filtreRole;
      return matchSearch && matchRole;
    });
  }

  countByRole(role: string): number {
    if (role === 'TOUS') return this.membres.length;
    return this.membres.filter(m => m.role === role).length;
  }

  initiales(nom: string): string {
    if (!nom) return '?';
    return nom.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  roleColor(role: string): string {
    return role === 'SUPERVISEUR'
      ? 'background:#EFF9FF; color:#3AAFDA; border:1px solid #BAE6FD;'
      : 'background:#EDFAF4; color:#059669; border:1px solid #4ECBA0;';
  }

  roleIcon(role: string): string {
    return role === 'SUPERVISEUR' ? 'fa-user-tie' : 'fa-calculator';
  }

  openEdit(m: MembreEquipe): void {
    this.editTarget = m;
    this.editNom = m.nom;
    this.editEmail = m.email;
    this.editRole = m.role;
    this.showModal = true;
    this.successMsg = '';
    this.errorMsg = '';
  }

  closeModal(): void {
    this.showModal = false;
    this.editTarget = null;
  }

  saveEdit(): void {
    if (!this.editTarget) return;
    if (!this.editNom.trim() || !this.editEmail.trim()) {
      this.errorMsg = 'Nom et email sont obligatoires.';
      return;
    }
    this.saving = true;
    this.errorMsg = '';
    const id = this.editTarget.id;
    this.http.put<MembreEquipe>(`${environment.apiUrl}/admin/users/${id}`, {
      nom: this.editNom.trim(),
      email: this.editEmail.trim(),
      role: this.editRole,
    }).subscribe({
      next: (updated) => {
        // Remove from list if role changed to PARTENAIRE
        if (updated.role === 'PARTENAIRE') {
          this.membres = this.membres.filter(m => m.id !== id);
        } else {
          const idx = this.membres.findIndex(m => m.id === id);
          if (idx !== -1) this.membres[idx] = { ...this.membres[idx], ...updated };
        }
        this.saving = false;
        this.showModal = false;
        this.flash('Informations mises à jour avec succès.');
      },
      error: (err) => {
        this.saving = false;
        this.showError(err?.error?.message ?? 'Erreur lors de la mise à jour.');
      },
    });
  }

  toggleStatut(m: MembreEquipe): void {
    this.processingId = m.id;
    this.http.patch<MembreEquipe>(`${environment.apiUrl}/admin/users/${m.id}/toggle-statut`, {}).subscribe({
      next: (updated) => {
        const idx = this.membres.findIndex(x => x.id === m.id);
        if (idx !== -1) this.membres[idx] = { ...this.membres[idx], statut: updated.statut };
        this.processingId = null;
        this.flash(`Statut de ${m.nom} modifié.`);
      },
      error: (err) => {
        this.processingId = null;
        this.showError(err?.error?.message ?? 'Erreur lors du changement de statut.');
      },
    });
  }

  private flash(msg: string): void {
    this.successMsg = msg;
    setTimeout(() => (this.successMsg = ''), 4000);
  }

  private showError(msg: string): void {
    this.errorMsg = msg;
    setTimeout(() => (this.errorMsg = ''), 4000);
  }
}
