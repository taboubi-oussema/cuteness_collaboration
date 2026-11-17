package com.cuteness.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sous_pack")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SousPack {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pack_id", nullable = false)
    private Pack pack;

    @Column(nullable = false)
    private String nom;

    private String nomAr;
    private String emoji;
    private String theme;   // coral | blue | mint | pink | gold

    /** Pipe-separated product list, e.g. "Crème hydratante|Sérum anti-âge" */
    @Column(columnDefinition = "TEXT")
    private String produitsFr;

    @Column(columnDefinition = "TEXT")
    private String produitsAr;

    @Column(name = "image_url")
    private String imageUrl;

    @Builder.Default
    private int ordre = 0;

    @Builder.Default
    private int stock = 0;

    /** Soft-activation flag kept for DB compatibility */
    @Builder.Default
    private boolean actif = true;

    @OneToMany(mappedBy = "sousPack", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("ordre ASC")
    @Builder.Default
    private List<SousPackImage> images = new ArrayList<>();
}
