import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComptableStateService } from '../../services/comptable-state.service';
import { Partenaire, NoeudReseau } from '../../models/comptable.types';

@Component({
  selector: 'app-comptable-reseau',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comptable-reseau.html',
  styleUrls: ['../../dashboard/comptable-dashboard.css'],
})
export class ComptableReseauComponent implements OnInit {
  readonly state = inject(ComptableStateService);

  recherche = '';

  ngOnInit(): void {
    this.state.load();
  }

  get partenairesFiltered(): Partenaire[] {
    const all = this.state.partenaires$.value;
    if (!this.recherche) return all;
    const q = this.recherche.toLowerCase();
    return all.filter(p => (p.nom || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q));
  }

  get currentTree(): NoeudReseau | null {
    const reseau = this.state.reseau$.value;
    if (!this.recherche) return reseau;
    const q = this.recherche.toLowerCase();
    return this.findNodeByName(reseau, q);
  }

  private findNodeByName(node: NoeudReseau, query: string): NoeudReseau | null {
    if ((node.nom || '').toLowerCase().includes(query)) return node;
    if (node.filleuls) {
      for (const child of node.filleuls) {
        const found = this.findNodeByName(child, query);
        if (found) return found;
      }
    }
    return null;
  }

  countTotalNodes(node: NoeudReseau): number {
    let count = 1;
    if (node.filleuls) {
      for (const child of node.filleuls) {
        count += this.countTotalNodes(child);
      }
    }
    return count;
  }

  masquerInfo = (info: string, type: string) => this.state.masquerInfo(info, type);
  paymentIcon = (type: string) => this.state.paymentIcon(type);
  paymentColor = (type: string) => this.state.paymentColor(type);
}
