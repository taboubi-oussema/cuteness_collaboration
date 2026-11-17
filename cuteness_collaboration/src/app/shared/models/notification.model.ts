export interface OrderNotification {
  readonly id: number;
  readonly reference: string;
  readonly type: string;
  readonly statut: 'EN_ATTENTE' | 'LIVREE' | 'ANNULEE';
  readonly title: string;
  readonly message: string;
  readonly montant: number;
  readonly date: string;
  lu?: boolean; // Indique si la notification a été lue localement.
}
