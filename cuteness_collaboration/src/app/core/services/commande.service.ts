import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Observable }         from 'rxjs';

import { environment }        from '../../../environments/environment';

const BASE_URL = environment.apiUrl;

export interface Commande {
  id?: number;
  statut?: string;
  montantTotal?: number;
  dateCommande?: string;
  adresse?: string;
  modePaiement?: string;
  optionRemise?: string;
  lignes?: { 
    nomProduit?: string; 
    produitId?: number; 
    quantite?: number; 
  }[];
}

@Injectable({ providedIn: 'root' })
export class CommandeService {

  private readonly _http = inject(HttpClient);

  getMesCommandes(): Observable<Commande[]> {
    return this._http.get<Commande[]>(`${BASE_URL}/commandes/mes-commandes`);
  }

  passerCommande(body: Partial<Commande>): Observable<Commande> {
    return this._http.post<Commande>(`${BASE_URL}/commandes`, body);
  }

  acheterPack(packId: number): Observable<{ message: string }> {
    return this._http.post<{ message: string }>(`${BASE_URL}/partenaire/acheter-pack`, { packId });
  }
}