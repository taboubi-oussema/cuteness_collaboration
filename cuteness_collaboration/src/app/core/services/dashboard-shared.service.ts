import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser }               from '@angular/common';
import { AuthService }                     from './auth.service';
import { Transaction }                     from '../../features/comptable/models/comptable.types';

type NotifType = 
  | 'commission' 
  | 'commande' 
  | 'reseau' 
  | 'info'
  | 'COMMISSION_ATTENTE'
  | 'COMMISSION_VALIDEE'
  | 'LIVRAISON'
  | 'PARRAINAGE'
  | 'INSCRIPTION_NOUVELLE'
  | 'INSCRIPTION_EN_COURS'
  | 'INSCRIPTION_TRAITEE'
  | 'INSCRIPTION_LIVREE'
  | 'COMPTE_APPROUVE'
  | 'COMPTE_REFUSE'
  | 'ORDER_STATUS';

type TransactionType = 'ACHAT' | 'COMMISSION' | 'CREDIT';

@Injectable({ providedIn: 'root' })
export class DashboardSharedService {

  private readonly _authService = inject(AuthService);
  private readonly _platformId  = inject(PLATFORM_ID);

  packEmoji(pack: string): string {
    const map: Record<string, string> = {
      Starter: '🥉',
      Silver:  '🥈',
      Gold:    '🥇',
    };
    return map[pack] ?? '📦';
  }

  transactionMessage(t: Pick<Transaction, 'type' | 'montant'>): string {
    const labels: Record<string, string> = {
      COMMISSION: `Commission de ${t.montant} DT reçue`,
      ACHAT:      `Achat de ${t.montant} DT effectué`,
      CREDIT:     `Crédit de ${t.montant} DT ajouté`,
    };
    return labels[t.type] ?? `Transaction de ${t.montant} DT`;
  }

  transactionMessageAr(t: Pick<Transaction, 'type' | 'montant'>): string {
    const labels: Record<string, string> = {
      COMMISSION: `تم استلام عمولة ${t.montant} دت`,
      ACHAT:      `تم الشراء بقيمة ${t.montant} دت`,
      CREDIT:     `تم إضافة رصيد ${t.montant} دت`,
    };
    return labels[t.type] ?? `معاملة ${t.montant} دت`;
  }

  notifIcon(type: NotifType): string {
    const map: Record<string, string> = {
      commission: 'fas fa-coins',
      commande:   'fas fa-shopping-cart',
      reseau:     'fas fa-users',
      info:       'fas fa-info-circle',
      COMMISSION_ATTENTE: 'fas fa-clock',
      COMMISSION_VALIDEE: 'fas fa-coins',
      LIVRAISON: 'fas fa-truck',
      PARRAINAGE: 'fas fa-user-plus',
      INSCRIPTION_NOUVELLE: 'fas fa-user-clock',
      INSCRIPTION_EN_COURS: 'fas fa-spinner',
      INSCRIPTION_TRAITEE: 'fas fa-check',
      INSCRIPTION_LIVREE: 'fas fa-check-circle',
      COMPTE_APPROUVE: 'fas fa-user-check',
      COMPTE_REFUSE: 'fas fa-user-times',
      ORDER_STATUS: 'fas fa-box',
    };
    return map[type] ?? 'fas fa-bell';
  }

  notifColor(type: NotifType): string {
    const map: Record<string, string> = {
      commission: 'nc-mint',
      commande:   'nc-blue',
      reseau:     'nc-coral',
      info:       'nc-gold',
      COMMISSION_ATTENTE: 'nc-gold',
      COMMISSION_VALIDEE: 'nc-mint',
      LIVRAISON: 'nc-blue',
      PARRAINAGE: 'nc-coral',
      INSCRIPTION_NOUVELLE: 'nc-gold',
      INSCRIPTION_EN_COURS: 'nc-blue',
      INSCRIPTION_TRAITEE: 'nc-mint',
      INSCRIPTION_LIVREE: 'nc-mint',
      COMPTE_APPROUVE: 'nc-mint',
      COMPTE_REFUSE: 'nc-coral',
      ORDER_STATUS: 'nc-blue',
    };
    return map[type] ?? 'nc-blue';
  }

  transactionIcon(type: TransactionType): string {
    const map: Record<TransactionType, string> = {
      ACHAT:      'fas fa-shopping-cart',
      COMMISSION: 'fas fa-coins',
      CREDIT:     'fas fa-wallet',
    };
    return map[type] ?? 'fas fa-exchange-alt';
  }

  transactionColor(type: TransactionType): string {
    const map: Record<TransactionType, string> = {
      ACHAT:      'nc-coral',
      COMMISSION: 'nc-mint',
      CREDIT:     'nc-blue',
    };
    return map[type] ?? 'nc-blue';
  }

  logout(): void {
    this._authService.logout();
  }

  /**
   * Génère une clé de semaine au format ISO (ex: "2026-W17") pour une date donnée.
   */
  getWeekKey(date: Date): string {
    const firstJan  = new Date(date.getFullYear(), 0, 1);
    const days      = Math.floor((date.getTime() - firstJan.getTime()) / 86_400_000) + 1;
    const weekNumber = Math.ceil((days + firstJan.getDay()) / 7);
    return `${date.getFullYear()}-W${weekNumber}`;
  }

  /**
   * Analyse une date dans plusieurs formats possibles :
   * - Timestamp Unix (nombre ou chaîne)
   * - Chaîne ISO standard
   * - Format français "JJ/MM/AAAA"
   * - Format "AAAA-MM-JJ" par défaut
   * Retourne null si la valeur est vide ou invalide.
   */
  parseDate(dateStr: string | number | any[] | null | undefined): Date | null {
    if (dateStr === null || dateStr === undefined || dateStr === '') return null;

    // Cas particulier d'un objet Java LocalDateTime sérialisé sous forme de tableau [année, mois, jour]
    if (Array.isArray(dateStr)) {
      const [year, month, day] = dateStr as number[];
      if (year && month && day) {
        const d = new Date(year, month - 1, day);
        if (!isNaN(d.getTime())) return d;
      }
      return null;
    }

    const asNum = Number(dateStr);
    if (!isNaN(asNum) && asNum > 0) return new Date(asNum);

    const str = String(dateStr).trim();

    const native = new Date(str);
    if (!isNaN(native.getTime())) return native;

    const slashParts = str.split('/');
    if (slashParts.length === 3) {
      const [d, m, y] = slashParts.map(Number);
      if (y > 1900) {
        const date = new Date(y, m - 1, d);
        if (!isNaN(date.getTime())) return date;
      }
    }

    const hyphenParts = str.split('-').map(x => x.trim());
    if (hyphenParts.length === 3) {
      const [y, m, d] = hyphenParts.map(Number);
      const date = new Date(y, m - 1, d);
      if (!isNaN(date.getTime())) return date;
    }

    return null;
  }

  /**
   * Formate une date en chaîne de caractères selon la locale française.
   * Si la valeur ne peut pas être analysée, elle est renvoyée telle quelle.
   */
  formatDate(value: string | number | any[] | Date | null | undefined): string {
    if (value === null || value === undefined || value === '') return '';
    if (Array.isArray(value)) {
      const [year, month, day] = value as number[];
      if (year && month && day) {
        const d = new Date(year, month - 1, day);
        if (!isNaN(d.getTime())) return d.toLocaleDateString('fr-FR');
      }
      return '';
    }
    const d = typeof value === 'number' ? new Date(value) : new Date(value as string);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('fr-FR');
  }

  /**
   * Déclenche le téléchargement d'un fichier CSV.
   * Inactif en mode SSR grâce à la vérification isPlatformBrowser.
   */
  downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
    if (!isPlatformBrowser(this._platformId)) return;

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
