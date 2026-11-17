package com.cuteness.backend.entity;

import com.cuteness.backend.enums.PointsSourceType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "points_historique")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PointsHistorique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partenaire_id", nullable = false)
    private User partenaire;

    @Column(nullable = false)
    private int points;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false)
    private PointsSourceType sourceType;

    @Column(name = "source_id")
    private Long sourceId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();
}
