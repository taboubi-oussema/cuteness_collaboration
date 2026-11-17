package com.cuteness.backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AvisProduitResponse {
    private int id;
    private String contenu;
    private String imageUrl;
    private LocalDateTime dateCreation;
    private String auteurNom;
    private int userId;
}
