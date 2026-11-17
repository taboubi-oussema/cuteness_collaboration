package com.cuteness.backend.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String  nom;
    private String  email;
    private String  motDePasse;
    private String  telephone;
    private Integer packId;
    private String  codeParrainage;  // optionnel — code du parrain
    private String  region;          // gouvernorat tunisien
    private String  modePaiement;    // carte_bancaire / e_dinar
    private String  banque;          // si carte bancaire
    private String  infoBancaire;    // numéro compte ou numéro e-dinar
}