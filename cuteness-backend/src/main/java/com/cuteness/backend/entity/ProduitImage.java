package com.cuteness.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "produit_image")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProduitImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produit_id", nullable = false)
    private Produit produit;

    @Column(name = "image_url", nullable = false)
    private String imageUrl;

    @Builder.Default
    private int ordre = 0;
}
