package com.cuteness.backend.dto;

import lombok.Data;

@Data
public class SousPackRequest {
    private String nom;
    private String nomAr;
    private String emoji;
    private String theme;
    private String produitsFr;   // pipe-separated
    private String produitsAr;
    private String imageUrl;
    private int    ordre;
    private int    stock;
}
