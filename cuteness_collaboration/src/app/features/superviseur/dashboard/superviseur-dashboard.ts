import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-superviseur-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './superviseur-dashboard.html',
  styleUrls: ['./superviseur-dashboard.css'],
})
export class SuperviseurDashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);

  sidebarOpen = true;
  superviseurName = 'Superviseur';
  today = new Date();

  stats = {
    commandesEnAttente: 0,
    signalements: 0,
    partenaires: 0,
  };

  notifCount = 0;

  private pollInterval: any;

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    // #region agent log
    fetch('http://127.0.0.1:7888/ingest/673d7c49-1923-46e3-a3c2-3ff94659600c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d91175'},body:JSON.stringify({sessionId:'d91175',location:'superviseur-dashboard.ts:35',message:'superviseur shell opened',data:{authenticated:this.authService.isAuthenticated(),storedRole:user?.role ?? null,hasToken:!!this.authService.getToken()},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (user) this.superviseurName = user.nom;
    this.loadStats();
    this.loadNotifCount();
    // Poll every 60s for new commandes / notifications
    this.pollInterval = setInterval(() => {
      this.loadStats();
      this.loadNotifCount();
    }, 60_000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  loadStats(): void {
    this.http.get<Record<string, unknown>>(`${environment.apiUrl}/dashboard/admin`).subscribe({
      next: (data) => {
        this.stats.commandesEnAttente = Number(data?.['commandesEnAttente'] ?? 0);
        this.stats.partenaires = Number(data?.['totalPartenaires'] ?? 0);
        this.stats.signalements = Number(data?.['signalementsOuverts'] ?? 0);
      },
      error: () => {},
    });
  }

  loadNotifCount(): void {
    this.http.get<any>(`${environment.apiUrl}/notifications/count`).subscribe({
      next: (data) => { this.notifCount = data?.nonLues ?? 0; },
      error: () => {},
    });
  }

  goToNotifications(): void { this.router.navigate(['/superviseur/notifications']); }
  toggleSidebar(): void { this.sidebarOpen = !this.sidebarOpen; }
  logout(): void { this.authService.logout(); }
}
