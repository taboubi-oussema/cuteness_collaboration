import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ComptableStateService } from '../../../comptable/services/comptable-state.service';
import { Partenaire, NoeudReseau } from '../../../comptable/models/comptable.types';
import { environment } from '../../../../../environments/environment';

interface EditForm {
  packId:       number | null;
  solde:        number;
  modePaiement: string;
  infoBancaire: string;
  banque:       string;
  statut:       boolean;
  role:         string;
}

interface Pack { id: number; nom: string; prix: number; emoji: string; }

const API = environment.apiUrl.replace("/api", "");

@Component({
  selector: 'app-admin-reseau',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-reseau.html',
  styleUrls: [
    '../../dashboard/Dashboard.component.css',
    '../../../comptable/dashboard/comptable-dashboard.css',
    './admin-reseau.css',
  ],
})
export class AdminReseauComponent implements OnInit {
  private http  = inject(HttpClient);
  readonly state = inject(ComptableStateService);

  recherche     = '';
  saving        = false;
  successMsg    = '';
  errorMsg      = '';

  // modal edit
  selectedPartenaire: Partenaire | null = null;
  editForm: EditForm = this.emptyForm();

  // filleuls du partenaire sélectionné
  filleuls: Partenaire[] = [];
  loadingFilleuls = false;

  // partenaires disponibles pour changer le parrain d'un filleul
  packs: Pack[] = [];

  ngOnInit(): void {
    this.state.load();
    this.http.get<Pack[]>(`${API}/api/packs`).subscribe({
      next: p => this.packs = p,
      error: () => {}
    });
  }

  get partenairesFiltered(): Partenaire[] {
    const all = this.state.partenaires$.value;
    if (!this.recherche) return all;
    const q = this.recherche.toLowerCase();
    return all.filter(p =>
      p.nom.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      (p.pack || '').toLowerCase().includes(q)
    );
  }

  openEdit(p: Partenaire): void {
    this.selectedPartenaire = p;
    const packId = this.packs.find(pk => pk.nom.toLowerCase() === (p.pack || '').toLowerCase())?.id ?? null;
    this.editForm = {
      packId,
      solde:        p.solde,
      modePaiement: p.typePayment,
      infoBancaire: p.infoBancaire,
      banque:       p.banque ?? '',
      statut:       p.actif,
      role:         'PARTENAIRE',
    };
    this.filleuls = [];
    this.loadFilleuls(p);
    this.successMsg = '';
    this.errorMsg   = '';
  }

  closeEdit(): void {
    this.selectedPartenaire = null;
  }

  private loadFilleuls(p: Partenaire): void {
    if (!p.userId) return;
    this.loadingFilleuls = true;
    this.http.get<any[]>(`${API}/api/admin/users/${p.userId}/filleuls`).subscribe({
      next: (data) => {
        this.filleuls = data.map(f => ({
          id: String(f.id), userId: f.id,
          nom: f.nom, email: f.email,
          pack: '', solde: 0, niveau: 0,
          actif: f.statut, typePayment: 'RIB' as const,
          infoBancaire: '', banque: '',
          parrain: null, filleuls: 0, totalGains: 0,
        }));
        this.loadingFilleuls = false;
      },
      error: () => { this.loadingFilleuls = false; }
    });
  }

  removeFilleul(filleul: Partenaire): void {
    if (!filleul.userId) return;
    // Remove parrain by setting parrainId = 0 (null)
    this.http.patch(`${API}/api/admin/users/${filleul.userId}/reseau`, { parrainId: 0 }).subscribe({
      next: () => {
        this.filleuls = this.filleuls.filter(f => f.userId !== filleul.userId);
        this.state.reload();
      },
      error: () => { this.errorMsg = 'Erreur lors de la suppression du filleul.'; }
    });
  }

  save(): void {
    if (!this.selectedPartenaire?.userId) return;
    this.saving = true;
    this.errorMsg = '';

    const payload: any = {
      solde:        this.editForm.solde,
      modePaiement: this.editForm.modePaiement,
      infoBancaire: this.editForm.infoBancaire,
      banque:       this.editForm.banque,
      statut:       this.editForm.statut,
      role:         this.editForm.role,
    };
    if (this.editForm.packId) payload.packId = this.editForm.packId;

    this.http.patch(`${API}/api/admin/users/${this.selectedPartenaire.userId}/reseau`, payload).subscribe({
      next: () => {
        this.saving = false;
        this.successMsg = 'Modifications enregistrées.';
        this.state.reload();
        // Update local list
        const updated = this.state.partenaires$.value.map(p =>
          p.userId === this.selectedPartenaire!.userId
            ? { ...p,
                pack: this.packs.find(pk => pk.id === this.editForm.packId)?.nom ?? p.pack,
                solde: this.editForm.solde,
                typePayment: this.editForm.modePaiement as any,
                infoBancaire: this.editForm.infoBancaire,
                banque: this.editForm.banque,
                actif: this.editForm.statut }
            : p
        );
        this.state.partenaires$.next(updated);
      },
      error: () => {
        this.saving = false;
        this.errorMsg = 'Erreur lors de la sauvegarde.';
      }
    });
  }

  packBadgeClass(pack: string): string {
    const p = (pack || '').toLowerCase();
    if (p.includes('gold'))    return 'pack-gold';
    if (p.includes('silver'))  return 'pack-silver';
    return 'pack-starter';
  }

  private emptyForm(): EditForm {
    return { packId: null, solde: 0, modePaiement: 'RIB', infoBancaire: '', banque: '', statut: true, role: 'PARTENAIRE' };
  }

  banques = ['BIAT','BNA','STB','Attijari Bank','BH Bank','Amen Bank','UIB','Autre'];

  // ── MLM tree ──
  get currentTree(): NoeudReseau | null {
    const reseau = this.state.reseau$.value;
    if (!this.recherche) return reseau;
    return this.findNodeByName(reseau, this.recherche.toLowerCase());
  }

  private findNodeByName(node: NoeudReseau, query: string): NoeudReseau | null {
    if ((node.nom || '').toLowerCase().includes(query)) return node;
    for (const child of (node.filleuls ?? [])) {
      const found = this.findNodeByName(child, query);
      if (found) return found;
    }
    return null;
  }

  countTotalNodes(node: NoeudReseau): number {
    return 1 + (node.filleuls ?? []).reduce((s, c) => s + this.countTotalNodes(c), 0);
  }

  paymentIcon  = (t: string) => this.state.paymentIcon(t);
  paymentColor = (t: string) => this.state.paymentColor(t);
}
