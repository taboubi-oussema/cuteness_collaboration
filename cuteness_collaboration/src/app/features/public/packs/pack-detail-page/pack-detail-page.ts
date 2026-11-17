import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface SousPack {
  id: number;
  nom: string;
  nomAr: string;
  emoji: string;
  theme: string;
  produitsFr: string[];
  produitsAr: string[];
  imageUrl?: string;
  ordre: number;
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
  selector: 'app-pack-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pack-detail-page.html',
  styleUrls: ['./pack-detail-page.css']
})
export class PackDetailPageComponent implements OnInit {
  private http  = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  pack: Pack | null = null;
  isLoading = true;
  lang: 'fr' | 'ar' = 'fr';
  selectedSpId: number | null = null;
  currentImgIndex = 0;

  private readonly API = `${environment.apiUrl}/packs`;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/packs']); return; }

    this.http.get<Pack>(`${this.API}/${id}`).subscribe({
      next: (data) => {
        this.pack = data;
        this.isLoading = false;
        const spParam = this.route.snapshot.queryParamMap.get('subpack');
        if (spParam) this.selectedSpId = +spParam;
      },
      error: () => { this.isLoading = false; this.router.navigate(['/packs']); }
    });
  }

  get selectedSp(): SousPack | null {
    if (!this.pack || !this.selectedSpId) return null;
    return this.pack.sousPacks.find(s => s.id === this.selectedSpId) ?? null;
  }

  get allImages(): string[] {
    if (!this.pack) return [];
    const imgs = [...(this.pack.images || [])];
    if (this.selectedSp?.imageUrl && !imgs.includes(this.selectedSp.imageUrl)) {
      imgs.unshift(this.selectedSp.imageUrl);
    }
    return imgs;
  }

  features(): string[] {
    if (!this.pack) return [];
    const raw = this.lang === 'ar' ? (this.pack.featuresAr || this.pack.featuresFr) : this.pack.featuresFr;
    if (!raw) return [];
    return raw.split('|').map(s => s.trim()).filter(Boolean);
  }

  mlmTable(): { level: number; rate: string; label: string }[] {
    if (!this.pack) return [];
    const ar = this.lang === 'ar';
    const rows: { level: number; rate: string; label: string }[] = [];
    if (this.pack.tauxCommissionDirect > 0)
      rows.push({ level: 1, rate: this.pack.tauxCommissionDirect + '%',
        label: ar ? 'المستوى 1 (مباشر)' : 'Niveau 1 (Direct)' });
    if (this.pack.tauxCommissionNiveau2 > 0)
      rows.push({ level: 2, rate: this.pack.tauxCommissionNiveau2 + '%',
        label: ar ? 'المستوى 2 (غير مباشر)' : 'Niveau 2 (Indirect)' });
    if (this.pack.tauxCommissionNiveau3 > 0)
      rows.push({ level: 3, rate: this.pack.tauxCommissionNiveau3 + '%',
        label: ar ? 'المستوى 3 (الشبكة الموسعة)' : 'Niveau 3 (Réseau étendu)' });
    return rows;
  }

  advantages(): { icon: string; title: string; desc: string }[] {
    if (!this.pack) return [];
    const json = this.lang === 'ar' ? (this.pack.advantagesArJson || this.pack.advantagesFrJson) : this.pack.advantagesFrJson;
    try { return JSON.parse(json || '[]'); } catch { return []; }
  }

  register(): void {
    if (!this.pack) return;
    const params: any = { pack: this.pack.nom.toLowerCase() };
    if (this.selectedSp) params['subpack'] = this.selectedSp.nom.toLowerCase().replace(/\s+/g, '-');
    this.router.navigate(['/auth/register'], { queryParams: params });
  }

  getImageUrl(url: string): string {
    if (!url) return '';
    return url.startsWith('http') ? url : `${environment.apiUrl.replace("/api", "")}${url}`;
  }

  colorClass(): string {
    const map: Record<string, string> = {
      coral: 'hero-coral', blue: 'hero-blue', mint: 'hero-mint',
      pink: 'hero-pink', gold: 'hero-gold'
    };
    return map[this.pack?.color || 'coral'] ?? 'hero-coral';
  }

  prevImg(): void {
    if (!this.allImages.length) return;
    this.currentImgIndex = (this.currentImgIndex - 1 + this.allImages.length) % this.allImages.length;
  }

  nextImg(): void {
    if (!this.allImages.length) return;
    this.currentImgIndex = (this.currentImgIndex + 1) % this.allImages.length;
  }
}
