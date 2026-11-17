import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  produitId: number;
  nom: string;
  prix: number;       // prix final (promotion incluse si applicable)
  prixOriginal: number;
  imageUrl: string | null;
  qty: number;
}

const STORAGE_KEY = 'cc_cart';

@Injectable({ providedIn: 'root' })
export class CartService {

  private itemsSubject = new BehaviorSubject<CartItem[]>(this.load());
  readonly items$ = this.itemsSubject.asObservable();

  get count(): number {
    return this.itemsSubject.value.reduce((s, i) => s + i.qty, 0);
  }

  get items(): CartItem[] {
    return this.itemsSubject.value;
  }

  add(item: Omit<CartItem, 'qty'>): void {
    const current = [...this.itemsSubject.value];
    const idx = current.findIndex(i => i.produitId === item.produitId);
    if (idx >= 0) {
      current[idx] = { ...current[idx], qty: current[idx].qty + 1 };
    } else {
      current.push({ ...item, qty: 1 });
    }
    this.save(current);
  }

  remove(produitId: number): void {
    this.save(this.itemsSubject.value.filter(i => i.produitId !== produitId));
  }

  updateQty(produitId: number, qty: number): void {
    if (qty <= 0) { this.remove(produitId); return; }
    this.save(this.itemsSubject.value.map(i =>
      i.produitId === produitId ? { ...i, qty } : i
    ));
  }

  clear(): void {
    this.save([]);
  }

  subtotal(): number {
    return this.itemsSubject.value.reduce((s, i) => s + i.prix * i.qty, 0);
  }

  private load(): CartItem[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch { return []; }
  }

  private save(items: CartItem[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    this.itemsSubject.next(items);
  }
}
