package com.cuteness.backend.repository;

import com.cuteness.backend.entity.ChallengeCondition;
import com.cuteness.backend.entity.ChallengeConditionProgress;
import com.cuteness.backend.entity.ChallengeParticipation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface ChallengeConditionProgressRepository extends JpaRepository<ChallengeConditionProgress, Long> {
    List<ChallengeConditionProgress> findByParticipation(ChallengeParticipation participation);
    Optional<ChallengeConditionProgress> findByParticipationAndCondition(
            ChallengeParticipation participation, ChallengeCondition condition);

    @Transactional
    @Modifying
    @Query("DELETE FROM ChallengeConditionProgress p WHERE p.condition.challenge.id = :challengeId")
    void deleteByConditionChallengeId(@Param("challengeId") Long challengeId);
}
