import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface GradeConfig {
  id: number;
  grade: string;
  pointsMin: number;
  rewardType: string | null;
  rewardValeur: number;
  rewardDureeJours: number;
  rewardDescription: string;
}

interface PointsSourceConfig {
  id: number;
  sourceType: string;
  pointsParAction: number;
  description: string;
  actif: boolean;
}

@Component({
  selector: 'app-admin-grade-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-grade-config.html',
  styleUrls: ['./admin-grade-config.css'],
})
export class AdminGradeConfigComponent implements OnInit {
  private http = inject(HttpClient);
  private readonly API = environment.apiUrl;

  grades: GradeConfig[] = [];
  sources: PointsSourceConfig[] = [];
  loading = false;
  saving: Record<number, boolean> = {};
  savingSource: Record<number, boolean> = {};

  readonly GRADE_ICONS: Record<string, string> = {
    STARTER:  '🥉',
    BRONZE:   '🥉',
    SILVER:   '🥈',
    GOLD:     '👑',
    PLATINUM: '💎',
    DIAMOND:  '💠',
  };

  readonly GRADE_COLORS: Record<string, string> = {
    STARTER:  '#94a3b8',
    BRONZE:   '#cd7f32',
    SILVER:   '#9ca3af',
    GOLD:     '#d97706',
    PLATINUM: '#7c3aed',
    DIAMOND:  '#0ea5e9',
  };

  readonly REWARD_TYPES = [
    { value: '',                  label: 'Aucune récompense' },
    { value: 'COMMISSION_BOOST',  label: '📈 Boost commission (%)' },
    { value: 'REDUCTION_POURCENT',label: '🏷️ Réduction sur commandes (%)' },
    { value: 'BADGE',             label: '🏅 Badge exclusif' },
    { value: 'TIRAGE_SORT',       label: '🎁 Tirage au sort' },
  ];

  readonly SOURCE_LABELS: Record<string, string | undefined> = {
    PARRAINAGE:      '👥 Parrainage (nouveau filleul)',
    COMMANDE_LIVREE: '🛒 Commande livrée',
    FORMATION:       '🎓 Formation complétée',
    ACHAT_PACK:      '📦 Achat de pack',
  };

  ngOnInit(): void {
    this.loadGrades();
    this.loadSources();
  }

  loadGrades(): void {
    this.loading = true;
    this.http.get<GradeConfig[]>(`${this.API}/grade-configs`).subscribe({
      next: (data) => { this.grades = data ?? []; this.loading = false; },
      error: ()     => { this.loading = false; },
    });
  }

  loadSources(): void {
    this.http.get<PointsSourceConfig[]>(`${this.API}/points/admin/sources`).subscribe({
      next: (data) => { this.sources = data ?? []; },
      error: ()     => {},
    });
  }

  saveGrade(g: GradeConfig): void {
    this.saving[g.id] = true;
    const payload = {
      pointsMin:         g.pointsMin,
      rewardType:        g.rewardType || null,
      rewardValeur:      g.rewardValeur,
      rewardDureeJours:  g.rewardDureeJours,
      rewardDescription: g.rewardDescription,
    };
    this.http.put<GradeConfig>(`${this.API}/grade-configs/${g.id}`, payload).subscribe({
      next: (updated) => {
        const idx = this.grades.findIndex(x => x.id === updated.id);
        if (idx !== -1) this.grades[idx] = updated;
        this.saving[g.id] = false;
      },
      error: () => { this.saving[g.id] = false; },
    });
  }

  saveSource(s: PointsSourceConfig): void {
    this.savingSource[s.id] = true;
    this.http.put<PointsSourceConfig>(`${this.API}/points/admin/sources/${s.id}`, {
      pointsParAction: s.pointsParAction,
      actif:           s.actif,
    }).subscribe({
      next: (updated) => {
        const idx = this.sources.findIndex(x => x.id === updated.id);
        if (idx !== -1) this.sources[idx] = updated;
        this.savingSource[s.id] = false;
      },
      error: () => { this.savingSource[s.id] = false; },
    });
  }

  rewardTypeLabel(type: string | null): string {
    return this.REWARD_TYPES.find(r => r.value === (type ?? ''))?.label ?? '—';
  }

  gradeIcon(grade: string):  string { return this.GRADE_ICONS[grade]  ?? '🥉'; }
  gradeColor(grade: string): string { return this.GRADE_COLORS[grade] ?? '#94a3b8'; }
}
