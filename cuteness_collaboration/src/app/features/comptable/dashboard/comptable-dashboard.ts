import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { ComptableStateService } from '../services/comptable-state.service';
import { DashboardSharedService } from '../../../core/services/dashboard-shared.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-comptable-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './comptable-dashboard.html',
  styleUrls: ['./comptable-dashboard.css'],
})
export class ComptableDashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private http        = inject(HttpClient);
  readonly state = inject(ComptableStateService);
  private shared = inject(DashboardSharedService);

  sidebarOpen = true;
  comptableName = 'Comptable';
  comptableEmail = '';
  signalementCount = 0;

  private pollInterval: any;

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.comptableName = user.nom;
      this.comptableEmail = user.email;
    }
    this.state.load();
    this.loadSignalementCount();
    this.pollInterval = setInterval(() => {
      this.state.load();
      this.loadSignalementCount();
    }, 30_000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  loadSignalementCount(): void {
    this.http.get<any[]>(`${environment.apiUrl}/signalements/mes-signalements`).subscribe({
      next: (data) => {
        this.signalementCount = (data ?? []).filter(
          s => s.reponseSuperviseur || s.reponseAdmin
        ).length;
      },
      error: () => {},
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout(): void {
    this.shared.logout();
  }
}
