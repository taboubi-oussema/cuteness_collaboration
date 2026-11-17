import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { NotificationService } from '../../../core/services/notification.service';

interface AdminStats {
  totalPartners: number;
  pendingCommissions: number;
  commandesEnAttente: number;
  transactionsTotal: number;
  notifications: number;
  reports: number;
  comptesEnAttente: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./Dashboard.component.css'],
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private notifService = inject(NotificationService);

  sidebarOpen = window.innerWidth > 768;
  adminName = 'Admin';
  adminEmail = '';
  today = new Date();

  stats: AdminStats = {
    totalPartners: 0,
    pendingCommissions: 0,
    commandesEnAttente: 0,
    transactionsTotal: 0,
    notifications: 0,
    reports: 0,
    comptesEnAttente: 0,
  };

  private pollSub?: Subscription;

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.adminName = user.nom;
      this.adminEmail = user.email;
    }
    this.loadStats();
    this.loadNotifCount();
    this.loadComptesEnAttente();
    // refresh badges every 30 seconds
    this.pollSub = interval(30_000).subscribe(() => {
      this.loadStats();
      this.loadNotifCount();
      this.loadComptesEnAttente();
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  loadStats(): void {
    this.dashboardService.getAdminDashboard().subscribe({
      next: (data) => {
        this.stats.totalPartners       = Number(data.totalPartenaires    ?? 0);
        this.stats.pendingCommissions  = Number(data.commissionsEnAttente ?? 0);
        this.stats.commandesEnAttente  = Number(data.commandesEnAttente  ?? 0);
        this.stats.transactionsTotal   = Number(data.transactionsTotal   ?? 0);
        this.stats.notifications       = Number(data.notifications       ?? 0);
        this.stats.reports             = Number(data.signalementsOuverts ?? 0);
      },
      error: () => {},
    });
  }

  loadNotifCount(): void {
    this.notifService.countNonLues().subscribe({
      next: (data) => { this.stats.notifications = data.nonLues; },
      error: () => {},
    });
  }

  loadComptesEnAttente(): void {
    this.dashboardService.getComptesEnAttente().subscribe({
      next: (data) => { this.stats.comptesEnAttente = (data ?? []).length; },
      error: () => {},
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebarOnMobile(): void {
    if (window.innerWidth <= 768) this.sidebarOpen = false;
  }

  logout(): void {
    this.authService.logout();
  }
}
