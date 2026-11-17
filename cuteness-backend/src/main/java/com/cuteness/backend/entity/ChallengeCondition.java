package com.cuteness.backend.entity;

import com.cuteness.backend.enums.ChallengeType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "challenge_conditions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChallengeCondition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "challenge_id", nullable = false)
    private Challenge challenge;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChallengeType type;

    @Column(name = "objectif_valeur", nullable = false)
    private int objectifValeur;

    @Column(name = "points_recompense", nullable = false)
    private int pointsRecompense;

    @Column(nullable = false)
    private String description;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "INT DEFAULT 0")
    private int ordre = 0;
}
