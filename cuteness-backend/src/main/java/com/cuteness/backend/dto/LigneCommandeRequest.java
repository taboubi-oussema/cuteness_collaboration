package com.cuteness.backend.dto;

import lombok.Data;

@Data
public class LigneCommandeRequest {
    private Integer produitId;  // nullable — either produit or pack
    private Integer packId;     // nullable — either produit or pack
    private int quantite;
}
