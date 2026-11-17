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
public class PackResponse {
    private int id;
    private String nom;
    private String nomAr;
    private String description;
    private double prix;
    private double tauxCommissionDirect;
    private double tauxCommissionNiveau2;
    private double tauxCommissionNiveau3;
    private double tauxReduction;
    private String imageUrl;
    // content
    private String emoji;
    private String color;
    private int niveaux;
    private String taglineFr;
    private String taglineAr;
    private String featuresFr;
    private String featuresAr;
    private String advantagesFrJson;
    private String advantagesArJson;
    // relations
    private List<SousPackResponse> sousPacks;
    private List<String> images;
}
