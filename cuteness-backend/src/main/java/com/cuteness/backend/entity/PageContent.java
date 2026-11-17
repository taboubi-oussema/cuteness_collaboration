package com.cuteness.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "page_content",
       uniqueConstraints = @UniqueConstraint(columnNames = {"section", "cle"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PageContent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    /** hero | stats | banner_promo | packs | contact | theme | cta | footer */
    @Column(nullable = false, length = 50)
    private String section;

    /** titre | sous_titre | image | video_url | couleur ... */
    @Column(nullable = false, length = 80)
    private String cle;

    /** Le contenu réel (texte, URL, code couleur...) */
    @Column(columnDefinition = "TEXT")
    private String valeur;

    /** text | image | video | color | boolean */
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String type = "text";

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PrePersist
    @PreUpdate
    public void touch() { this.updatedAt = LocalDateTime.now(); }
}
