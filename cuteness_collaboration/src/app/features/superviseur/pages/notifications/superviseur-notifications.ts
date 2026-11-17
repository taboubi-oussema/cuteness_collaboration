import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NotificationService, AppNotification } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-superviseur-notifications',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './superviseur-notifications.html',
  styleUrls: ['../../dashboard/superviseur-dashboard.css'],
})
export class SuperviseurNotificationsComponent implements OnInit {
  private notifService = inject(NotificationService);

  notifications: AppNotification[] = [];
  isLoading = true;

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

  typeIcon(type: string): string {
    const map: Record<string, string> = {
      COMMANDE:             'fas fa-shopping-cart',
      LIVRAISON:            'fas fa-truck',
      INSCRIPTION_NOUVELLE: 'fas fa-user-clock',
      INSCRIPTION_EN_COURS: 'fas fa-spinner',
      INSCRIPTION_TRAITEE:  'fas fa-check',
      INSCRIPTION_LIVREE:   'fas fa-check-circle',
      COMMISSION_ATTENTE:   'fas fa-clock',
      COMMISSION_VALIDEE:   'fas fa-coins',
    };
    return map[type] ?? 'fas fa-info-circle';
  }

  typeColor(type: string): string {
    const success = ['LIVRAISON', 'INSCRIPTION_TRAITEE', 'INSCRIPTION_LIVREE', 'COMMISSION_VALIDEE'];
    const warning = ['COMMANDE', 'INSCRIPTION_NOUVELLE', 'COMMISSION_ATTENTE'];
    if (success.includes(type)) return 'notif-success';
    if (warning.includes(type)) return 'notif-warning';
    return 'notif-info';
  }
}
