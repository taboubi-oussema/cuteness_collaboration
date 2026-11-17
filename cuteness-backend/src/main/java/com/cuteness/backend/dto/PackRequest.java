package com.cuteness.backend.dto;

import lombok.Data;

@Data
public class PackRequest {
    private String nom;
    private String nomAr;
    private String description;
    private double prix;
    private double tauxCommissionDirect;
    private double tauxCommissionNiveau2;
    private double tauxCommissionNiveau3;
    private double tauxReduction;
    private String imageUrl;
    // content fields
    private String emoji;
    private String color;
    private int niveaux;
    private String taglineFr;
    private String taglineAr;
    private String featuresFr;
    private String featuresAr;
    private String advantagesFrJson;
    private String advantagesArJson;
}
