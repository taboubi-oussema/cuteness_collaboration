package com.cuteness.backend.dto;

import lombok.Data;

@Data
public class FormationRequest {
    private String titre;
    private String description;
    private String duree;
    private String niveau;
    private String videoUrl;
    /** TOUS | STARTER | SILVER | GOLD */
    private String accesRequis = "TOUS";
    private String imageUrl;
    private int ordre;
}
