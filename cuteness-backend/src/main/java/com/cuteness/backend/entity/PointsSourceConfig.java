package com.cuteness.backend.entity;

import com.cuteness.backend.enums.PointsSourceType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "points_source_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PointsSourceConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", unique = true, nullable = false)
    private PointsSourceType sourceType;

    @Column(name = "points_par_action", nullable = false)
    private int pointsParAction;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "TINYINT(1) DEFAULT 1")
    private boolean actif = true;
}
