package com.cuteness.backend.dto;

import com.cuteness.backend.enums.StatutCommande;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CommandeResponse {
    private int id;
    private LocalDateTime dateCommande;
    private StatutCommande statut;
    private double montantOriginal;
    private double tauxReduction;
    private double montantReduction;
    private double montantTotal;
    private double fraisLivraison;
    private String adresse;
    private String gouvernerat;
    private String ville;
    private String localite;
    private String modePaiement;
    private String optionRemise;
    private boolean remboursementApprouve;
    private String nomPartenaire;
    private String emailPartenaire;
    private String telephonePartenaire;
    private String regionPartenaire;
    private String nomPack;
    private String navexRef;
    private String navexStatut;
    private boolean confirmationComptableRequise;
    private String typeConfirmation;
    private String nomSuperviseur;
    private String emailSuperviseur;
    private List<LigneCommandeResponse> lignes;
}
