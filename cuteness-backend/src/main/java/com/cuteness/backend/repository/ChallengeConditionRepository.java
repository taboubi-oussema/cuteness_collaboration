package com.cuteness.backend.repository;

import com.cuteness.backend.entity.Challenge;
import com.cuteness.backend.entity.ChallengeCondition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ChallengeConditionRepository extends JpaRepository<ChallengeCondition, Long> {
    List<ChallengeCondition> findByChallengeOrderByOrdreAsc(Challenge challenge);

    @Transactional
    @Modifying
    @Query("DELETE FROM ChallengeCondition c WHERE c.challenge.id = :challengeId")
    void deleteByChallengeId(@Param("challengeId") Long challengeId);
}
