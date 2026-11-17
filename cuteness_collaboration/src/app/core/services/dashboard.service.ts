import { Injectable, inject }     from '@angular/core';
import { HttpClient }              from '@angular/common/http';
import { Observable }              from 'rxjs';

import { environment }             from '../../../environments/environment';
import {
  PartnerDashboardResponse,
  AdminDashboardResponse,
  ComptableDashboardResponse,
  ReseauNodeDto,
} from '../../shared/models/dashboard.model';

const BASE_URL = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class DashboardService {

  private readonly _http = inject(HttpClient);

  getPartnerDashboard(): Observable<PartnerDashboardResponse> {
    return this._http.get<PartnerDashboardResponse>(`${BASE_URL}/dashboard/partenaire`);
  }

  getAdminDashboard(): Observable<AdminDashboardResponse> {
    return this._http.get<AdminDashboardResponse>(`${BASE_URL}/dashboard/admin`);
  }

  getComptableDashboard(): Observable<ComptableDashboardResponse> {
    return this._http.get<ComptableDashboardResponse>(`${BASE_URL}/dashboard/comptable`);
  }

  getReseau(): Observable<ReseauNodeDto> {
    return this._http.get<ReseauNodeDto>(`${BASE_URL}/dashboard/reseau`);
  }

  getFullNetworkTree(): Observable<ReseauNodeDto> {
    return this._http.get<ReseauNodeDto>(`${BASE_URL}/dashboard/reseau/full`);
  }

  validerCommission(id: number): Observable<any> {
    return this._http.post(`${BASE_URL}/dashboard/commission/valider/${id}`, {});
  }

  refuserCommission(id: number): Observable<any> {
    return this._http.post(`${BASE_URL}/dashboard/commission/refuser/${id}`, {});
  }

  validerToutAdmin(): Observable<any> {
    return this._http.post(`${BASE_URL}/dashboard/commission/valider-tout`, {});
  }

  payerCommission(id: number): Observable<any> {
    return this._http.post(`${BASE_URL}/dashboard/commission/payer/${id}`, {});
  }

  supprimerCommission(id: number): Observable<void> {
    return this._http.delete<void>(`${BASE_URL}/dashboard/commission/${id}`);
  }

  confirmerVirement(
    partenaireId: number,
    montant: number,
    infoBancaire: string,
    typePayment: string,
    semaine: string,
  ): Observable<{ success: boolean; virement: { id: string } }> {
    return this._http.post<{ success: boolean; virement: { id: string } }>(
      `${BASE_URL}/dashboard/virement/confirmer`,
      { partenaireId, montant, infoBancaire, typePayment, semaine },
    );
  }

  getNotifications(): Observable<any[]> {
    return this._http.get<any[]>(`${BASE_URL}/dashboard/notifications`);
  }

  countNotificationsNonLues(): Observable<{ nonLues: number }> {
    return this._http.get<{ nonLues: number }>(`${BASE_URL}/dashboard/notifications/count`);
  }

  marquerNotificationsLues(): Observable<void> {
    return this._http.post<void>(`${BASE_URL}/dashboard/notifications/marquer-lues`, {});
  }

  getComptesEnAttente(): Observable<any[]> {
    return this._http.get<any[]>(`${BASE_URL}/dashboard/comptes/en-attente`);
  }

  approuverCompte(id: number): Observable<any> {
    return this._http.post(`${BASE_URL}/dashboard/comptes/approuver/${id}`, {});
  }

  rejeterCompte(id: number): Observable<any> {
    return this._http.post(`${BASE_URL}/dashboard/comptes/rejeter/${id}`, {});
  }

  getInscriptions(): Observable<any[]> {
    return this._http.get<any[]>(`${BASE_URL}/inscriptions`);
  }

  getMesInscriptions(): Observable<any[]> {
    return this._http.get<any[]>(`${BASE_URL}/inscriptions/mes-demandes`);
  }

  getInscriptionsTraitees(): Observable<any[]> {
    return this._http.get<any[]>(`${BASE_URL}/inscriptions/traitees`);
  }

  prendreEnChargeInscription(id: number): Observable<any> {
    return this._http.post(`${BASE_URL}/inscriptions/${id}/prendre-en-charge`, {});
  }

  marquerInscriptionTraitee(id: number): Observable<any> {
    return this._http.post(`${BASE_URL}/inscriptions/${id}/marquer-traitee`, {});
  }

  marquerInscriptionLivree(id: number): Observable<any> {
    return this._http.post(`${BASE_URL}/inscriptions/${id}/marquer-livree`, {});
  }

  creerColisNavex(id: number): Observable<any> {
    return this._http.post(`${BASE_URL}/inscriptions/${id}/colis-navex`, {});
  }
}
