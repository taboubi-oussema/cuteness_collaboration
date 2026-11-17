import { Injectable, inject }                   from '@angular/core';
import { HttpClient }                             from '@angular/common/http';
import { BehaviorSubject, Observable }            from 'rxjs';
import { tap }                                    from 'rxjs/operators';

import { environment }                            from '../../../environments/environment';
import { PageContent }                            from '../../shared/models/content.model';

const API = `${environment.apiUrl}/content`;

@Injectable({ providedIn: 'root' })
export class ContentService {

  private readonly _http = inject(HttpClient);

  private readonly _content$ = new BehaviorSubject<PageContent[]>([]);

  readonly content$ = this._content$.asObservable();

  /**
   * Charge toutes les entrées du CMS dans le cache en mémoire.
   * S'abonner à `content$` pour réagir aux mises à jour.
   */
  loadAll(): Observable<PageContent[]> {
    return this._http.get<PageContent[]>(API).pipe(
      tap(data => this._content$.next(data))
    );
  }

  get(section: string, cle: string, defaultValue = ''): string {
    const item = this._content$.value.find(
      c => c.section === section && c.cle === cle
    );
    return item?.valeur ?? defaultValue;
  }

  saveAll(entries: PageContent[]): Observable<PageContent[]> {
    return this._http.post<PageContent[]>(`${API}/save`, entries).pipe(
      tap(data => this._content$.next(data))
    );
  }
}
