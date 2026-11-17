package com.cuteness.backend.entity;

import com.cuteness.backend.enums.GradeNiveau;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "partner_points")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartnerPoints {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partenaire_id", unique = true, nullable = false)
    private User partenaire;

    @Builder.Default
    @Column(name = "points_total", nullable = false, columnDefinition = "INT DEFAULT 0")
    private int pointsTotal = 0;

    @Builder.Default
    @Column(name = "points_challenge", nullable = false, columnDefinition = "INT DEFAULT 0")
    private int pointsChallenge = 0;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, columnDefinition = "VARCHAR(20) DEFAULT 'STARTER'")
    private GradeNiveau grade = GradeNiveau.STARTER;

    @Column(name = "date_maj")
    private LocalDateTime dateMaj;

    @PrePersist
    @PreUpdate
    public void beforeSave() {
        this.dateMaj = LocalDateTime.now();
    }
}
