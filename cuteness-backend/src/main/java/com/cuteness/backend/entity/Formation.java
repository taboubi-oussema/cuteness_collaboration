package com.cuteness.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "formations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Formation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String duree;

    /** Débutant / Intermédiaire / Avancé */
    private String niveau;

    /** URL vidéo ou lien externe */
    private String videoUrl;

    /**
     * Accès requis : TOUS | STARTER | SILVER | GOLD
     * TOUS  = visible même sans être partenaire
     * STARTER = partenaires avec n'importe quel pack
     * SILVER  = partenaires avec pack Silver ou Gold
     * GOLD    = partenaires avec pack Gold uniquement
     */
    @Builder.Default
    @Column(nullable = false)
    private String accesRequis = "TOUS";

    @Column(name = "image_url")
    private String imageUrl;

    @Builder.Default
    @Column(nullable = false)
    private int ordre = 0;
}
