package com.cuteness.backend.entity;

import com.cuteness.backend.enums.GradeNiveau;
import com.cuteness.backend.enums.RewardType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "grade_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GradeConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(unique = true, nullable = false)
    private GradeNiveau grade;

    @Column(name = "points_min", nullable = false)
    private int pointsMin;

    @Enumerated(EnumType.STRING)
    @Column(name = "reward_type")
    private RewardType rewardType;

    @Column(name = "reward_valeur")
    private double rewardValeur;

    @Column(name = "reward_duree_jours")
    private int rewardDureeJours;

    @Column(name = "reward_description", columnDefinition = "TEXT")
    private String rewardDescription;
}
