import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NotificationService, AppNotification } from '../../../../core/services/notification.service';
import { DashboardService } from '../../../../core/services/dashboard.service';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './admin-notifications.html',
  styleUrls: ['../../dashboard/Dashboard.component.css', '../../../comptable/dashboard/comptable-dashboard.css'],
})
export class AdminNotificationsComponent implements OnInit {
  private notifService = inject(NotificationService);
  private dashboardService = inject(DashboardService);

  notifications: AppNotification[] = [];
  isLoading = true;
  activationSuccess = '';
  activationError = '';

  get nonLues(): number {
    return this.notifications.filter(n => !n.lu).length;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.notifService.getMesNotifications().subscribe({
      next: (data) => { this.notifications = data; this.isLoading = false; },
      error: () => { this.isLoading = false; },
    });
  }

  marquerLu(n: AppNotification): void {
    n.lu = true;
  }

  marquerToutLu(): void {
    this.notifService.marquerToutesLues().subscribe({
      next: () => this.notifications.forEach(n => (n.lu = true)),
    });
  }

  activerCompte(n: AppNotification): void {
    if (!n.referenceId) return;
    this.dashboardService.approuverCompte(n.referenceId).subscribe({
      next: () => {
        n.type = 'COMPTE_APPROUVE';
        n.lu = true;
        n.referenceId = undefined;
        this.activationSuccess = 'Compte activé avec succès.';
        setTimeout(() => (this.activationSuccess = ''), 4000);
      },
      error: () => {
        this.activationError = "Erreur lors de l'activation.";
        setTimeout(() => (this.activationError = ''), 3000);
      },
    });
  }

  typeIcon(type: string): string {
    const map: Record<string, string> = {
      COMPTE_A_APPROUVER:     'fas fa-user-check',
      COMPTE_APPROUVE:        'fas fa-user-check',
      COMPTE_REFUSE:          'fas fa-user-times',
      COMMISSION_ATTENTE:     'fas fa-clock',
      COMMISSION_VALIDEE:     'fas fa-coins',
      COMMISSION_VALIDEE_ADMIN: 'fas fa-coins',
      COMMISSION_REFUSEE:     'fas fa-times-circle',
      LIVRAISON:              'fas fa-truck',
      COMMANDE:               'fas fa-shopping-cart',
      PARRAINAGE:             'fas fa-user-plus',
      INSCRIPTION_NOUVELLE:   'fas fa-user-clock',
      INSCRIPTION_EN_COURS:   'fas fa-spinner',
      INSCRIPTION_TRAITEE:    'fas fa-check',
      INSCRIPTION_LIVREE:     'fas fa-check-circle',
    };
    return map[type] ?? 'fas fa-info-circle';
  }

  typeColor(type: string): string {
    const warning  = ['COMMISSION_ATTENTE', 'COMPTE_A_APPROUVER', 'INSCRIPTION_NOUVELLE'];
    const success  = ['COMMISSION_VALIDEE', 'COMMISSION_VALIDEE_ADMIN', 'COMPTE_APPROUVE',
                      'LIVRAISON', 'INSCRIPTION_TRAITEE', 'INSCRIPTION_LIVREE'];
    const danger   = ['COMMISSION_REFUSEE', 'COMPTE_REFUSE'];
    if (warning.includes(type))  return 'notif-warning';
    if (success.includes(type))  return 'notif-success';
    if (danger.includes(type))   return 'notif-warning';
    return 'notif-info';
  }
}
