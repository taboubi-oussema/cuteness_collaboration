package com.cuteness.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CategorieRequest {

    @NotBlank
    private String nom;

    private String description;

    /** Hex colour, e.g. #FF6B5B */
    private String couleur;

    /** Font Awesome icon class, e.g. fas fa-female */
    private String icone;
}
