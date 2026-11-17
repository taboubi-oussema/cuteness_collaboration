package com.cuteness.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProduitRequest {
    @NotBlank
    private String nom;
    private String description;
    @Min(0)
    private double prix;
    @Min(0)
    private int stock;
    /** Optional — links the product to a Categorie by its ID */
    private Integer categorieId;
    /** Optional product image URL */
    private String imageUrl;
    private boolean bestSeller;
    private boolean enPromo;
    private Double prixPromo;
    /** Public cible : femme | homme | enfant | maison | autre */
    private String cible;
}