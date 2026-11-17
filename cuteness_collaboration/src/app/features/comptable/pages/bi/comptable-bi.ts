import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { ComptableStateService } from '../../services/comptable-state.service';
import { BiData } from '../../models/comptable.types';

@Component({
  selector: 'app-comptable-bi',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comptable-bi.html',
  styleUrls: ['../../dashboard/comptable-dashboard.css'],
})
export class ComptableBiComponent implements OnInit {
  readonly state = inject(ComptableStateService);
  private readonly destroyRef = inject(DestroyRef);

  biData: BiData | null = null;

  ngOnInit(): void {
    this.state.load();
    this.state.biData$.pipe(
      filter(d => !!d),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(d => {
      this.biData = d;
    });
  }

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
}
