package com.cuteness.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CategorieResponse {
    private int id;
    private String nom;
    private String description;
    private String couleur;
    private String icone;
}
