package com.cuteness.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "packs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pack {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(nullable = false)
    private String nom;

    private String nomAr;

    private String description;

    @Column(nullable = false)
    private double prix;

    @Column(nullable = false)
    private int stock;

    // ─── MLM Commission rates ──────────────────────────────
    @Column(nullable = false)
    private double tauxCommissionDirect;

    @Column(nullable = false)
    private double tauxCommissionNiveau2;

    @Column(nullable = false)
    private double tauxCommissionNiveau3;

    // ─── Boutique discount ─────────────────────────────────
    @Column(nullable = false)
    private double tauxReduction;

    // ─── Visual identity ───────────────────────────────────
    private String emoji;           // 🥉 🥈 🥇
    private String color;           // coral | blue | gold

    @Column(name = "image_url")
    private String imageUrl;        // legacy single image (kept for compat)

    // ─── Content fields ────────────────────────────────────
    @Builder.Default
    private int niveaux = 1;

    @Column(name = "tagline_fr", length = 500)
    private String taglineFr;

    @Column(name = "tagline_ar", length = 500)
    private String taglineAr;

    /** Pipe-separated features, e.g. "Accès plateforme|Code parrainage|5% commission" */
    @Column(name = "features_fr", columnDefinition = "TEXT")
    private String featuresFr;

    @Column(name = "features_ar", columnDefinition = "TEXT")
    private String featuresAr;

    /** JSON array of {icon, title, desc} objects */
    @Column(name = "advantages_fr_json", columnDefinition = "TEXT")
    private String advantagesFrJson;

    @Column(name = "advantages_ar_json", columnDefinition = "TEXT")
    private String advantagesArJson;

    // ─── Relations ─────────────────────────────────────────
    @OneToMany(mappedBy = "pack", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("ordre ASC")
    @Builder.Default
    private List<SousPack> sousPacks = new ArrayList<>();

    @OneToMany(mappedBy = "pack", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("ordre ASC")
    @Builder.Default
    private List<PackImage> images = new ArrayList<>();
}
