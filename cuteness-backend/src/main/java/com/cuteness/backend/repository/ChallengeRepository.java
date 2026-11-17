package com.cuteness.backend.repository;

import com.cuteness.backend.entity.Challenge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ChallengeRepository extends JpaRepository<Challenge, Long> {

    List<Challenge> findByActifTrue();

    @Query("SELECT DISTINCT c FROM Challenge c LEFT JOIN FETCH c.conditions WHERE c.actif = true")
    List<Challenge> findByActifTrueWithConditions();

    @Query("SELECT DISTINCT c FROM Challenge c LEFT JOIN FETCH c.conditions")
    List<Challenge> findAllWithConditions();

    @Query("SELECT DISTINCT c FROM Challenge c LEFT JOIN FETCH c.conditions WHERE c.id = :id")
    Optional<Challenge> findByIdWithConditions(@Param("id") Long id);
}
