import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Observable }         from 'rxjs';

import { environment }        from '../../../environments/environment';

const BASE_URL = environment.apiUrl;

export interface Produit {
  readonly id: number;
  readonly nom: string;
  readonly description: string;
  readonly prix: number;
  readonly stock: number;
  readonly categorieId: number;
  readonly imageUrl?: string;
  readonly enPromo?: boolean;
  readonly prixPromo?: number;
  readonly bestSeller?: boolean;
  readonly categorie?: Categorie;
}

export interface Categorie {
  readonly id: number;
  readonly nom: string;
}

@Injectable({ providedIn: 'root' })
export class ProduitService {

  private readonly _http = inject(HttpClient);

  getAllProduits(): Observable<Produit[]> {
    return this._http.get<Produit[]>(`${BASE_URL}/produits`);
  }

  getCategories(): Observable<Categorie[]> {
    return this._http.get<Categorie[]>(`${BASE_URL}/categories`);
  }

  getProduitById(id: number): Observable<Produit> {
    return this._http.get<Produit>(`${BASE_URL}/produits/${id}`);
  }
}