package com.cuteness.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LigneCommandeResponse {
    private int id;
    private String nomProduit;  // produit or pack name
    private int quantite;
    private double prixUnitaire;
    private double sousTotal;
}
