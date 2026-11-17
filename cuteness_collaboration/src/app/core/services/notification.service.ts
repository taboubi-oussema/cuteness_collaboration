import { Injectable, inject }           from '@angular/core';
import { HttpClient }                    from '@angular/common/http';
import { Observable }                    from 'rxjs';

import { environment }                   from '../../../environments/environment';

export interface AppNotification {
  id: number;
  titre: string;
  message: string;
  type: string;       // COMMISSION_ATTENTE | COMMISSION_VALIDEE | LIVRAISON | PARRAINAGE | INSCRIPTION_* | COMPTE_*
  lu: boolean;
  date: string;
  referenceId?: number;  // Identifiant de l'utilisateur concerné (spécifié pour COMPTE_A_APPROUVER)
}

/** Alias historique conservé pour des raisons de compatibilité. */
export type OrderNotification = AppNotification;

const BASE_URL = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private readonly _http = inject(HttpClient);

  getMesNotifications(): Observable<AppNotification[]> {
    return this._http.get<AppNotification[]>(`${BASE_URL}/notifications`);
  }

  countNonLues(): Observable<{ nonLues: number }> {
    return this._http.get<{ nonLues: number }>(`${BASE_URL}/notifications/count`);
  }

  marquerToutesLues(): Observable<void> {
    return this._http.post<void>(`${BASE_URL}/notifications/marquer-lues`, {});
  }
}
