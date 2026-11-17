
export interface PartnerDashboardResponse {
  nom: string;
  email: string;
  telephone?: string;
  region?: string;
  monPack: string;
  tauxCommission: number;
  tauxReduction: number;
  soldeInterne: number;
  codeParrainage: string;
  dateCreation?: string;
  statut?: boolean;
  niveaux?: number;
  parrain?: string | null;
  totalCommissions: number;
  totalCommandes: number;
  reseauTotal: number;
  filleulsDirects: number;
  reseau?: ReseauNodeDto;
  transactions?: TransactionDto[];
  commissions?: CommissionDto[];
}

export interface AdminDashboardResponse {
  totalPartenaires?: number;
  totalCommissions?: number;
  totalCommandes?: number;
  chiffreAffaires?: number;
  commandesEnAttente?: number;
  commissionsEnAttente?: number;
  transactionsTotal?: number;
  signalementsOuverts?: number;
  notifications?: number;
  partenaires?: PartenaireDto[];
  commissions?: CommissionDto[];
  transactions?: TransactionDto[];
  signalements?: number;
  newThisMonth?: number;
  topPartenaires?: any[];
  mlmParPack?: Record<string, number>;
  activiteRecente?: any[];
}

export interface ComptableDashboardResponse {
  kpis: ComptableKpis;
  commissions: CommissionDto[];
  transactions: TransactionDto[];
  partenaires: PartenaireDto[];
  virements: VirementDto[];
}


export interface AdminKpis {
  totalPartenaires: number;
  totalCommissions: number;
  chiffreAffaires: number;
  commissionsAValider: number;
}

export interface ComptableKpis {
  totalCommissionsValidees: number;
  totalTransactionsPacks: number;
  totalTransactionsBoutique: number;
  commissionsAValider: number;
  totalPartenaires: number;
  revenusMonth: number;
  totalAVirer: number;
  virementsSemaine: number;
}

export interface CommissionDto {
  id: string | number;
  partenaire: string;
  source: string;
  sourceUserNom?: string;
  montant: number;
  niveau: number;
  statut: 'EN_ATTENTE' | 'VALIDEE' | 'REFUSEE';
  date: string;
  pack: string;
}

export interface TransactionDto {
  id: string | number;
  partenaire: string;
  type: string;
  description: string;
  montant: number;
  reduction: number;
  montantFinal: number;
  statut: string;
  date: string;
}

export interface PartenaireDto {
  id: string;
  userId: number;
  nom: string;
  email: string;
  pack: string;
  solde: number;
  niveau: number;
  actif: boolean;
  typePayment: 'CARTE' | 'RIB' | 'EDINAR';
  infoBancaire: string;
  banque?: string;
  parrain: string | null;
  filleuls: number;
  totalGains: number;
}

export interface VirementDto {
  id: string;
  partenaire: string;
  montant: number;
  infoBancaire: string;
  typePayment: string;
  statut: 'EN_ATTENTE' | 'EFFECTUE' | 'ECHOUE';
  date: string;
  semaine: string;
}

export interface ReseauNodeDto {
  id: string | number;
  nom: string;
  pack: string;
  niveau: number;
  actif: boolean;
  solde: number;
  filleuls: ReseauNodeDto[];
}

export interface NotificationDto {
  id: number;
  type: string;
  message: string;
  date: string;
  lu: boolean;
}

export interface VirementConfirmResponse {
  success: boolean;
  virement: VirementDto;
}
