import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { ComptableStateService } from '../../../comptable/services/comptable-state.service';
import { BiData } from '../../../comptable/models/comptable.types';

interface Chip { key: string; label: string; }

interface PartnerLineSeries {
  key: string;
  label: string;
  color: string;
  strokeDash: string;
  pointsStr: string;
  lastX: number;
  lastY: number;
  lastValue: number;
}

interface NetworkBar {
  x: number;
  barY: number;
  barHeight: number;
  count: number;
  label: string;
  color: string;
  labelX: number;
}

const MONTHS = 7;
const SVG_X_MIN = 60, SVG_X_MAX = 840, SVG_Y_MIN = 240, SVG_Y_MAX = 20;
const CUM_X_MIN = 46, CUM_X_MAX = 330, CUM_Y_BOTTOM = 148, CUM_Y_TOP = 22;
const NET_Y_BOTTOM = 187, NET_TARGET_HEIGHT = 141, NET_TARGET = 30;

@Component({
  selector: 'app-admin-bi',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-bi.html',
  styleUrls: ['../../dashboard/Dashboard.component.css', '../../../comptable/dashboard/comptable-dashboard.css'],
})
export class AdminBiComponent implements OnInit {
  readonly state = inject(ComptableStateService);
  private readonly destroyRef = inject(DestroyRef);

  biData: BiData | null = null;
  activeSoldesChip = '0';
  partnerChips: Chip[] = [];
  partnerSeries: PartnerLineSeries[] = [];
  partnerYAxis: Array<{ y: number; label: string }> = [];
  networkBars: NetworkBar[] = [];
  networkTargetY = NET_Y_BOTTOM - NET_TARGET_HEIGHT;
  networkStats = { total: 0, avg: 0, best: 0 };
  monthLabels: string[] = [];
  cumulativePointsStr = '';
  cumulativeStats = { start: 0, end: 0, pct: 0 };

  ngOnInit(): void {
    this.state.load();
    this.state.biData$.pipe(
      filter(d => !!d),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(d => {
      this.biData = d;
      this.computePartnerSeries();
      this.computeNetworkGrowth();
    });
  }

  // ── Computed getters ─────────────────────────────────────────────────

  get maxRevenu(): number {
    if (!this.biData?.revenusHebdo?.length) return 1;
    const max = Math.max(...this.biData.revenusHebdo.map(r => r.montant), 0);
    return max > 0 ? max : 1;
  }

  get maxTopGain(): number {
    if (!this.biData?.topPartenaires?.length) return 1;
    const max = Math.max(...this.biData.topPartenaires.map(p => p.gains), 0);
    return max > 0 ? max : 1;
  }

  get totalPartenaires(): number {
    return this.state.partenaires$.value.length;
  }

  get donutGradient(): string {
    const packs = this.biData?.repartitionPacks ?? [];
    if (!packs.length) return 'conic-gradient(#EAEDF5 0% 100%)';
    let cumulative = 0;
    const parts = packs.map(p => {
      const start = cumulative;
      cumulative += p.pourcentage;
      return `${p.color} ${start}% ${Math.min(cumulative, 100)}%`;
    });
    if (cumulative < 100) parts.push(`#EAEDF5 ${cumulative}% 100%`);
    return `conic-gradient(${parts.join(', ')})`;
  }

  get cumulativeFillPath(): string {
    if (!this.cumulativePointsStr) return '';
    const pts = this.cumulativePointsStr.split(' ');
    const firstX = pts[0].split(',')[0];
    const lastX = pts[pts.length - 1].split(',')[0];
    return `M${pts.join(' L')} L${lastX},${CUM_Y_BOTTOM} L${firstX},${CUM_Y_BOTTOM} Z`;
  }

  get midCumulativeLabel(): string {
    return Math.round((this.cumulativeStats.start + this.cumulativeStats.end) / 2).toString();
  }

  get cumLastX(): number {
    if (!this.cumulativePointsStr) return CUM_X_MAX;
    const pts = this.cumulativePointsStr.split(' ');
    return Number(pts[pts.length - 1].split(',')[0]);
  }

  get cumLastY(): number {
    if (!this.cumulativePointsStr) return CUM_Y_TOP;
    const pts = this.cumulativePointsStr.split(' ');
    return Number(pts[pts.length - 1].split(',')[1]);
  }

  // ── Chip / filter ────────────────────────────────────────────────────

  filterSoldes(key: string): void { this.activeSoldesChip = key; }

  getOpacity(key: string): number { return this.activeSoldesChip === key ? 1 : 0.1; }

  getWidth(key: string): number { return this.activeSoldesChip === key ? 3 : 2; }

  // ── SVG helpers ──────────────────────────────────────────────────────

  getMonthXPos(i: number): number {
    const n = this.monthLabels.length;
    return n <= 1 ? (SVG_X_MIN + SVG_X_MAX) / 2 : Math.round(SVG_X_MIN + (i / (n - 1)) * (SVG_X_MAX - SVG_X_MIN));
  }

  getCumXPos(i: number): number {
    const n = this.monthLabels.length;
    return n <= 1 ? (CUM_X_MIN + CUM_X_MAX) / 2 : Math.round(CUM_X_MIN + (i / (n - 1)) * (CUM_X_MAX - CUM_X_MIN));
  }

  // ── Chart computation ────────────────────────────────────────────────

  private computePartnerSeries(): void {
    const keys = this.state.getLastNMonthKeys(MONTHS);
    this.monthLabels = keys.map(k => this.state.getMonthLabel(k));

    const data = this.state.computePartnerMonthlyGains(MONTHS);
    if (!data.length) { this.partnerSeries = []; this.partnerChips = []; return; }

    const maxVal = Math.max(...data.flatMap(d => d.monthlyGains), 1);
    const mapX = (i: number) => Math.round(SVG_X_MIN + (i / (MONTHS - 1)) * (SVG_X_MAX - SVG_X_MIN));
    const mapY = (v: number) => Math.round(SVG_Y_MIN - (v / maxVal) * (SVG_Y_MIN - SVG_Y_MAX));

    this.partnerSeries = data.map((d, idx) => {
      const pts = d.monthlyGains.map((v, i) => `${mapX(i)},${mapY(v)}`);
      const lastIdx = MONTHS - 1;
      return {
        key: String(idx),
        label: `● ${d.nom}`,
        color: d.color,
        strokeDash: idx === 0 ? '' : '8,4',
        pointsStr: pts.join(' '),
        lastX: mapX(lastIdx),
        lastY: mapY(d.monthlyGains[lastIdx] ?? 0),
        lastValue: Math.round(d.monthlyGains[lastIdx] ?? 0),
      };
    });

    this.partnerChips = this.partnerSeries.map(s => ({ key: s.key, label: s.label }));
    if (!this.partnerSeries.some(s => s.key === this.activeSoldesChip)) {
      this.activeSoldesChip = this.partnerSeries[0]?.key ?? '0';
    }

    const step = maxVal / 4;
    this.partnerYAxis = [4, 3, 2, 1, 0].map(i => ({
      y: mapY(i * step),
      label: Math.round(i * step).toString(),
    }));
  }

  private computeNetworkGrowth(): void {
    const growthData = this.state.computeNetworkGrowthMonthly(MONTHS);
    const maxCount = Math.max(...growthData.map(d => d.count), NET_TARGET);
    const scale = NET_TARGET_HEIGHT / NET_TARGET;

    const barWidth = 32;
    const svgXLeft = 38, svgXRight = 422;
    const step = (svgXRight - svgXLeft) / MONTHS;

    let total = 0, best = 0;
    this.networkBars = growthData.map((d, i) => {
      total += d.count;
      best = Math.max(best, d.count);
      const barHeight = Math.round(d.count * scale);
      const barY = Math.max(10, NET_Y_BOTTOM - barHeight);
      const x = Math.round(svgXLeft + i * step + (step - barWidth) / 2);
      const color = d.count >= NET_TARGET ? '#4ECBA0' : d.count >= NET_TARGET * 0.7 ? '#FF6B5B' : '#3AAFDA';
      return { x, barY, barHeight, count: d.count, label: d.label, color, labelX: x + barWidth / 2 };
    });

    this.networkTargetY = NET_Y_BOTTOM - Math.round((NET_TARGET / maxCount) * NET_TARGET_HEIGHT);
    this.networkStats = { total, avg: Math.round((total / MONTHS) * 10) / 10, best };

    // Cumulative growth
    const currentTotal = this.state.partenaires$.value.length;
    const startingCount = Math.max(0, currentTotal - total);
    let cumulative = startingCount;
    const cumulativeValues = growthData.map(d => { cumulative += d.count; return cumulative; });
    const maxCum = Math.max(...cumulativeValues, currentTotal, startingCount + 1);

    const mapCumX = (i: number) => Math.round(CUM_X_MIN + (i / (MONTHS - 1)) * (CUM_X_MAX - CUM_X_MIN));
    const mapCumY = (v: number) => Math.round(CUM_Y_BOTTOM - ((v - startingCount) / (maxCum - startingCount || 1)) * (CUM_Y_BOTTOM - CUM_Y_TOP));

    this.cumulativePointsStr = cumulativeValues.map((v, i) => `${mapCumX(i)},${mapCumY(v)}`).join(' ');
    const pct = startingCount > 0 ? Math.round((currentTotal - startingCount) / startingCount * 100) : 0;
    this.cumulativeStats = { start: startingCount, end: currentTotal, pct };
  }
}
