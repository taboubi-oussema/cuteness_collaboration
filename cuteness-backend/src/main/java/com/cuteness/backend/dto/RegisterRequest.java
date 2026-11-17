package com.cuteness.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 100, message = "Le nom ne doit pas dépasser 100 caractères")
    private String  nom;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    @Size(max = 120, message = "L'email ne doit pas dépasser 120 caractères")
    private String  email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 8, max = 100, message = "Le mot de passe doit comporter au moins 8 caractères")
    private String  motDePasse;

    @Size(max = 30, message = "Le numéro de téléphone ne doit pas dépasser 30 caractères")
    private String  telephone;

    private Integer packId;

    @Size(max = 30, message = "Le code de parrainage ne doit pas dépasser 30 caractères")
    private String  codeParrainage;

    @Size(max = 100, message = "La région ne doit pas dépasser 100 caractères")
    private String  region;

    @Size(max = 50, message = "Le mode de paiement ne doit pas dépasser 50 caractères")
    private String  modePaiement;

    @Size(max = 100, message = "Le nom de la banque ne doit pas dépasser 100 caractères")
    private String  banque;

    @Size(max = 100, message = "L'info bancaire ne doit pas dépasser 100 caractères")
    private String  infoBancaire;
}
