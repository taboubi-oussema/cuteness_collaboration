export interface KPIs {
  totalCommissionsValidees: number;
  totalTransactionsPacks: number;
  totalTransactionsBoutique: number;
  commissionsAValider: number;
  totalPartenaires: number;
  revenusMonth: number;
  totalAVirer: number;
  virementsSemaine: number;
}

export interface Commission {
  id: string;
  partenaire: string;
  source: string;
  montant: number;
  niveau: number;
  statut: 'EN_ATTENTE' | 'VALIDEE_ADMIN' | 'VALIDEE' | 'REFUSEE';
  date: string;
  pack: string;
}

export interface Transaction {
  id: string;
  partenaire: string;
  type: 'PACK' | 'BOUTIQUE';
  description: string;
  montant: number;
  reduction: number;
  montantFinal: number;
  statut: 'PAYEE' | 'EN_ATTENTE' | 'ANNULEE';
  date: string;
}

export interface Partenaire {
  id: string;
  userId?: number;
  nom: string;
  email: string;
  pack: string;
  solde: number;
  niveau: number;
  actif: boolean;
  typePayment: 'CARTE' | 'RIB' | 'EDINAR';
  infoBancaire: string;
  banque: string;
  parrain: string | null;
  filleuls: number;
  totalGains: number;
}

export interface Virement {
  id: string;
  partenaire: string;
  montant: number;
  infoBancaire: string;
  typePayment: string;
  statut: 'EN_ATTENTE' | 'EFFECTUE' | 'ECHEC';
  date: string;
  semaine: string;
}

export interface NoeudReseau {
  id: string;
  nom: string;
  pack: string;
  niveau: number;
  actif: boolean;
  solde: number;
  filleuls: NoeudReseau[];
}

export interface Signalement {
  id: string;
  sujet: string;
  description: string;
  priorite: 'HAUTE' | 'MOYENNE' | 'BASSE';
  date: string;
  statut: 'ENVOYE' | 'EN_COURS' | 'RESOLU';
}

export interface BiData {
  revenusHebdo: Array<{ semaine: string; montant: number }>;
  repartitionPacks: Array<{ pack: string; count: number; pourcentage: number; color: string }>;
  topPartenaires: Array<{ nom: string; gains: number; pack: string }>;
  commissionsStats: Array<{ semaine: string; validees: number; refusees: number }>;
}
