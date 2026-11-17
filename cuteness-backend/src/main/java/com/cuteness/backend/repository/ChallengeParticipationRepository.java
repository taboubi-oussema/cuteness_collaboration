package com.cuteness.backend.repository;

import com.cuteness.backend.entity.Challenge;
import com.cuteness.backend.entity.ChallengeParticipation;
import com.cuteness.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ChallengeParticipationRepository extends JpaRepository<ChallengeParticipation, Long> {

    @Query("SELECT p FROM ChallengeParticipation p JOIN FETCH p.challenge WHERE p.partenaire = :partenaire")
    List<ChallengeParticipation> findByPartenaire(@Param("partenaire") User partenaire);

    Optional<ChallengeParticipation> findByPartenaireAndChallenge(User partenaire, Challenge challenge);

    boolean existsByPartenaireAndChallenge(User partenaire, Challenge challenge);
}
