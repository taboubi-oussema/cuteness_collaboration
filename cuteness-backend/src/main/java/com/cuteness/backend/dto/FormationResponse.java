package com.cuteness.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FormationResponse {
    private int id;
    private String titre;
    private String description;
    private String duree;
    private String niveau;
    private String videoUrl;
    private String accesRequis;
    private String imageUrl;
    private int ordre;
}
