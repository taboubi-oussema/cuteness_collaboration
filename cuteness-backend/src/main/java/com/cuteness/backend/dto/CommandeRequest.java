package com.cuteness.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.List;

@Data
public class CommandeRequest {
    @NotEmpty(message = "La commande doit contenir au moins un article")
    @Valid
    private List<LigneCommandeRequest> lignes;

    @Size(max = 255)
    private String adresse;

    @Size(max = 100)
    private String gouvernerat;

    @Size(max = 100)
    private String ville;

    @Size(max = 100)
    private String localite;

    @Size(max = 50)
    private String modePaiement;   // EN_LIGNE | CARTE

    @Size(max = 50)
    private String optionRemise;   // IMMEDIATE | REMBOURSEMENT

    @Size(max = 120)
    private String partenaireEmail; // renseigné par le superviseur pour créer une commande au nom d'un partenaire
}
