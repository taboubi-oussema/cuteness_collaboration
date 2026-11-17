import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface ChallengeCondition {
  id?: number;
  type: string;
  objectifValeur: number;
  pointsRecompense: number;
  description: string;
  ordre: number;
}

interface Challenge {
  id?: number;
  titre: string;
  description: string;
  imageUrl?: string;
  recompenseDescription: string;
  dateDebut?: string;
  dateFin?: string;
  actif: boolean;
  conditions: ChallengeCondition[];
  pointsTotaux?: number;
}

interface LeaderboardEntry {
  nom: string;
  pointsTotal: number;
  grade: string;
}

@Component({
  selector: 'app-admin-challenges',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-challenges.html',
  styleUrls: ['./admin-challenges.css'],
})
export class AdminChallengesComponent implements OnInit {
  private http = inject(HttpClient);
  private readonly API = environment.apiUrl;

  challenges: Challenge[] = [];
  leaderboard: LeaderboardEntry[] = [];
  loading = false;
  activeTab: 'challenges' | 'leaderboard' = 'challenges';

  showModal = false;
  editMode = false;
  saving = false;
  form: Challenge = this.emptyForm();
  deleteConfirmId: number | null = null;

  imageFile: File | null = null;
  imagePreview: string | null = null;
  imageUploading = false;

  readonly TYPES = ['PARRAINAGE', 'COMMANDE', 'COMMISSION', 'FORMATION', 'ACHAT_PACK'];

  readonly TYPE_LABELS: Record<string, string> = {
    PARRAINAGE: '👥 Parrainage',
    COMMANDE:   '🛒 Commande',
    COMMISSION: '💰 Commission',
    FORMATION:  '🎓 Formation',
    ACHAT_PACK: '📦 Achat Pack',
  };

  readonly GRADE_COLORS: Record<string, string> = {
    STARTER:  '#94a3b8',
    BRONZE:   '#cd7f32',
    SILVER:   '#c0c0c0',
    GOLD:     '#ffd700',
    PLATINUM: '#e5e4e2',
    DIAMOND:  '#b9f2ff',
  };

  readonly GRADE_ICONS: Record<string, string> = {
    STARTER:  '🥉',
    BRONZE:   '🥉',
    SILVER:   '🥈',
    GOLD:     '🥇',
    PLATINUM: '💎',
    DIAMOND:  '💠',
  };

  ngOnInit(): void {
    this.loadChallenges();
    this.loadLeaderboard();
  }

  loadChallenges(): void {
    this.loading = true;
    this.http.get<Challenge[]>(`${this.API}/challenges/admin`).subscribe({
      next: (data) => { this.challenges = data ?? []; this.loading = false; },
      error: ()     => { this.loading = false; },
    });
  }

  loadLeaderboard(): void {
    this.http.get<LeaderboardEntry[]>(`${this.API}/points/leaderboard`).subscribe({
      next: (data) => { this.leaderboard = data ?? []; },
      error: ()     => {},
    });
  }

  openCreate(): void {
    this.form         = this.emptyForm();
    this.editMode     = false;
    this.imageFile    = null;
    this.imagePreview = null;
    this.showModal    = true;
  }

  openEdit(c: Challenge): void {
    this.form         = { ...c, conditions: c.conditions ? c.conditions.map(cd => ({ ...cd })) : [] };
    this.editMode     = true;
    this.imageFile    = null;
    this.imagePreview = c.imageUrl ? `${environment.apiUrl.replace("/api", "")}${c.imageUrl}` : null;
    this.showModal    = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  // ── Conditions management ───────────────────────────────────────────────

  addCondition(): void {
    this.form.conditions.push({
      type: 'COMMANDE',
      objectifValeur: 1,
      pointsRecompense: 100,
      description: '',
      ordre: this.form.conditions.length,
    });
  }

  removeCondition(index: number): void {
    this.form.conditions.splice(index, 1);
    this.form.conditions.forEach((c, i) => c.ordre = i);
  }

  totalPoints(): number {
    return this.form.conditions.reduce((sum, c) => sum + (c.pointsRecompense || 0), 0);
  }

  // ── Image ───────────────────────────────────────────────────────────────

  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0] ?? null;
    if (!file) return;
    this.imageFile    = file;
    this.imagePreview = URL.createObjectURL(file);
  }

  // ── Save ────────────────────────────────────────────────────────────────

  save(): void {
    if (!this.form.titre?.trim()) return;
    if (this.form.conditions.length === 0) {
      alert('Ajoutez au moins une condition au challenge.');
      return;
    }

    if (this.imageFile) {
      this.imageUploading = true;
      const fd = new FormData();
      fd.append('file', this.imageFile);
      this.http.post<{ url: string }>(`${this.API}/upload`, fd).subscribe({
        next: (res) => {
          this.form.imageUrl  = res.url;
          this.imageUploading = false;
          this.submitForm();
        },
        error: () => { this.imageUploading = false; },
      });
    } else {
      this.submitForm();
    }
  }

  private submitForm(): void {
    this.saving = true;
    const payload = {
      ...this.form,
      dateDebut:  this.form.dateDebut?.trim()  || null,
      dateFin:    this.form.dateFin?.trim()    || null,
      conditions: this.form.conditions.map((c, i) => ({ ...c, ordre: i })),
    };

    const req = this.editMode
      ? this.http.put<Challenge>(`${this.API}/challenges/${this.form.id}`, payload)
      : this.http.post<Challenge>(`${this.API}/challenges`, payload);

    req.subscribe({
      next: (saved) => {
        if (this.editMode) {
          const idx = this.challenges.findIndex(c => c.id === saved.id);
          if (idx !== -1) this.challenges[idx] = saved;
        } else {
          this.challenges = [saved, ...this.challenges];
        }
        this.saving    = false;
        this.showModal = false;
      },
      error: () => { this.saving = false; },
    });
  }

  toggleActif(c: Challenge): void {
    this.http.put<Challenge>(`${this.API}/challenges/${c.id}`, { actif: !c.actif }).subscribe({
      next: (updated) => {
        const idx = this.challenges.findIndex(x => x.id === updated.id);
        if (idx !== -1) this.challenges[idx] = updated;
      },
      error: () => {},
    });
  }

  confirmDelete(id: number): void  { this.deleteConfirmId = id; }
  cancelDelete(): void             { this.deleteConfirmId = null; }

  doDelete(id: number): void {
    this.http.delete(`${this.API}/challenges/${id}`).subscribe({
      next: () => {
        this.challenges      = this.challenges.filter(c => c.id !== id);
        this.deleteConfirmId = null;
      },
      error: () => { this.deleteConfirmId = null; },
    });
  }

  gradeColor(grade: string): string { return this.GRADE_COLORS[grade] ?? '#94a3b8'; }
  gradeIcon(grade: string):  string { return this.GRADE_ICONS[grade]  ?? '🥉'; }

  private emptyForm(): Challenge {
    return {
      titre: '',
      description: '',
      imageUrl: '',
      recompenseDescription: '',
      dateDebut: '',
      dateFin: '',
      actif: true,
      conditions: [],
    };
  }
}
