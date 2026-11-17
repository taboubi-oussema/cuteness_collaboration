package com.cuteness.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class CommandeRequest {
    private List<LigneCommandeRequest> lignes;
    private String adresse;
    private String gouvernerat;
    private String ville;
    private String localite;
    private String modePaiement;   // EN_LIGNE | CARTE
    private String optionRemise;   // IMMEDIATE | REMBOURSEMENT
    private String partenaireEmail; // renseigné par le superviseur pour créer une commande au nom d'un partenaire
}
