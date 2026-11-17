package com.cuteness.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AvisProduitRequest {
    @NotBlank(message = "Le contenu de l'avis ne peut pas être vide")
    @Size(max = 2000, message = "L'avis ne peut pas dépasser 2000 caractères")
    private String contenu;

    @Size(max = 500)
    private String imageUrl;
}
