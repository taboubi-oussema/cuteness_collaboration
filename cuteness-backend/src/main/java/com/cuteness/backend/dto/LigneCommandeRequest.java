package com.cuteness.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class LigneCommandeRequest {
    private Integer produitId;  // nullable — either produit or pack
    private Integer packId;     // nullable — either produit or pack

    @Min(value = 1, message = "La quantité doit être au moins 1")
    @Max(value = 1000, message = "La quantité ne peut pas dépasser 1000")
    private int quantite;
}
