package com.cuteness.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "produits")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Produit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(nullable = false)
    private String nom;

    private String description;

    @Column(nullable = false)
    private double prix;

    @Column(nullable = false)
    private int stock;

    /** Optional category — nullable so existing products are unaffected */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "categorie_id")
    private Categorie categorie;

    // ─── Image ─────────────────────────────────────────────
    @Column(name = "image_url")
    private String imageUrl;

    // ─── Merchandising ─────────────────────────────────────
    @Builder.Default
    @Column(name = "best_seller", nullable = false)
    private boolean bestSeller = false;

    @Builder.Default
    @Column(name = "en_promo", nullable = false)
    private boolean enPromo = false;

    /** Prix promotionnel — utilisé seulement quand enPromo = true */
    @Column(name = "prix_promo")
    private Double prixPromo;

    /** Public cible : femme | homme | enfant | maison | autre — null = tous */
    @Column(name = "cible")
    private String cible;

    @OneToMany(mappedBy = "produit", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("ordre ASC")
    @Builder.Default
    private List<ProduitImage> images = new ArrayList<>();
}