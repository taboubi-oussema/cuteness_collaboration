export interface LoginRequest {
  email:      string;
  motDePasse: string;
}

export interface LoginResponse {
  token:  string;
  type:   string;
  id:     number;
  nom:    string;
  email:  string;
  role:   string;
  solde:  number;
  niveau: number;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ChangePasswordRequest {
  token:             string;
  nouveauMotDePasse: string;
  confirmation:      string;
}