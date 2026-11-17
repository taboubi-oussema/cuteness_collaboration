package com.cuteness.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "challenge_condition_progress",
       uniqueConstraints = @UniqueConstraint(columnNames = {"participation_id", "condition_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChallengeConditionProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participation_id", nullable = false)
    private ChallengeParticipation participation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "condition_id", nullable = false)
    private ChallengeCondition condition;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "INT DEFAULT 0")
    private int progression = 0;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "TINYINT(1) DEFAULT 0")
    private boolean complete = false;

    @Column(name = "date_completion")
    private LocalDateTime dateCompletion;

    @Builder.Default
    @Column(name = "points_gagnes", nullable = false, columnDefinition = "INT DEFAULT 0")
    private int pointsGagnes = 0;
}
