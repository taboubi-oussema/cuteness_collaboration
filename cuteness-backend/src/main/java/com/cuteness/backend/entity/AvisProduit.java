package com.cuteness.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "avis_produit")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AvisProduit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produit_id", nullable = false)
    private Produit produit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(columnDefinition = "TEXT")
    private String contenu;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    @PrePersist
    public void prePersist() {
        this.dateCreation = LocalDateTime.now();
    }
}
