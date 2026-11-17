package com.cuteness.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProduitResponse {
    private int id;
    private String nom;
    private String description;
    private double prix;
    private int stock;
    /** Embedded category summary — null when the product has no category */
    private CategorieResponse categorie;
    private String imageUrl;
    private boolean bestSeller;
    private boolean enPromo;
    private Double prixPromo;
    private String cible;
    private List<String> images;
}