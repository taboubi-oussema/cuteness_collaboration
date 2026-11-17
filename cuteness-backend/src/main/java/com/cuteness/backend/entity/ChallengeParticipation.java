package com.cuteness.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "challenge_participation",
       uniqueConstraints = @UniqueConstraint(columnNames = {"partenaire_id", "challenge_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChallengeParticipation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partenaire_id", nullable = false)
    private User partenaire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "challenge_id", nullable = false)
    private Challenge challenge;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "INT DEFAULT 0")
    private int progression = 0;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "TINYINT(1) DEFAULT 0")
    private boolean complete = false;

    @Column(name = "date_completion")
    private LocalDateTime dateCompletion;
}
