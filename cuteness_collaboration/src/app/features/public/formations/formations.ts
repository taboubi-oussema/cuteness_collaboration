import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { Role } from '../../../shared/models/user.model';
import { environment } from '../../../../environments/environment';

interface Formation {
  id: number;
  titre: string;
  description: string;
  duree: string;
  niveau: string;
  videoUrl: string;
  accesRequis: string;
  imageUrl: string;
  ordre: number;
}

@Component({
  selector: 'app-formations',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './formations.html',
  styleUrls: ['./formations.css'],
})
export class FormationsComponent implements OnInit {
  private http            = inject(HttpClient);
  private authService     = inject(AuthService);
  private dashboardService = inject(DashboardService);

  private readonly API = `${environment.apiUrl}/formations`;

  formations: Formation[] = [];
  isLoading = true;
  recherche = '';
  filtreNiveau = 'TOUS';

  isAuthenticated = false;
  isPartenaire    = false;

  /** Pack de l'utilisateur (ex: "Gold", "Silver", "Starter", etc.). */
  userPack: string | null = null;

  private readonly packHierarchy: Record<string, number> = {
    TOUS: 0, STARTER: 1, SILVER: 2, GOLD: 3,
  };

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.isPartenaire    = this.authService.hasRole(Role.PARTENAIRE);

    if (this.isPartenaire) {
      this.dashboardService.getPartnerDashboard().subscribe({
        next: (data) => { this.userPack = data.monPack ?? null; },
        error: () => {},
      });
    }

    this.loadFormations();
  }

  loadFormations(): void {
    this.isLoading = true;
    this.http.get<Formation[]>(this.API).subscribe({
      next: (data) => { this.formations = data; this.isLoading = false; },
      error: () => { this.isLoading = false; },
    });
  }

  hasAccess(f: Formation): boolean {
    const required = this.packHierarchy[f.accesRequis?.toUpperCase()] ?? 0;
    if (required === 0) return true;
    if (!this.userPack) return false;
    const userLevel = this.packHierarchy[this.userPack.toUpperCase()] ?? 1;
    return userLevel >= required;
  }

  get filtered(): Formation[] {
    return this.formations.filter(f => {
      const q = this.recherche.trim().toLowerCase();
      const matchSearch = !q ||
        f.titre.toLowerCase().includes(q) ||
        (f.description ?? '').toLowerCase().includes(q);
      const matchNiveau = this.filtreNiveau === 'TOUS' || f.niveau === this.filtreNiveau;
      return matchSearch && matchNiveau;
    });
  }

  get niveaux(): string[] {
    const set = new Set(this.formations.map(f => f.niveau).filter(Boolean));
    return Array.from(set);
  }

  getImageUrl(url: string | undefined): string {
    if (!url) return '';
    return url.startsWith('http') ? url : `${environment.apiUrl.replace("/api", "")}${url}`;
  }

  accesBadge(acces: string): { label: string; color: string } {
    switch ((acces ?? '').toUpperCase()) {
      case 'GOLD':    return { label: '⭐ Pack Gold',          color: '#f59e0b' };
      case 'SILVER':  return { label: '🥈 Pack Silver & Gold', color: '#6b7280' };
      case 'STARTER': return { label: '🎯 Partenaires',        color: '#3b82f6' };
      default:        return { label: '🌍 Tout le monde',       color: '#10b981' };
    }
  }

  niveauColor(niveau: string): string {
    switch (niveau) {
      case 'Débutant':      return '#10b981';
      case 'Intermédiaire': return '#f59e0b';
      case 'Avancé':        return '#ef4444';
      default:              return '#6b7280';
    }
  }
}
