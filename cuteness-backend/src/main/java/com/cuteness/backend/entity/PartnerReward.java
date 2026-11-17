package com.cuteness.backend.entity;

import com.cuteness.backend.enums.RewardType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "partner_rewards")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartnerReward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partenaire_id", nullable = false)
    private User partenaire;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RewardType type;

    @Column(nullable = false)
    private double valeur;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin")
    private LocalDate dateFin;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "TINYINT(1) DEFAULT 1")
    private boolean active = true;

    @Column(nullable = false)
    private String source;

    @Column(columnDefinition = "TEXT")
    private String description;
}
