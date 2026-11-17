export enum Role {
  ADMIN       = 'ADMIN',
  SUPERVISEUR = 'SUPERVISEUR',
  COMPTABLE   = 'COMPTABLE',
  PARTENAIRE  = 'PARTENAIRE'
}

export interface User {
  id:              number;
  nom:             string;
  email:           string;
  solde:           number;
  niveau:          number;
  role:            Role;
  codeParrainage?: string;
  actif:           boolean;
  dateCreation:    string;
}

export interface JwtPayload {
  sub:    string;
  role:   Role;
  userId: number;
  nom:    string;
  iat:    number;
  exp:    number;
}