package com.cuteness.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Categorie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(nullable = false)
    private String nom;

    private String description;

    /** Hex colour code, e.g. #FF6B5B */
    private String couleur;

    /** Font Awesome icon class, e.g. fas fa-female */
    private String icone;
}
