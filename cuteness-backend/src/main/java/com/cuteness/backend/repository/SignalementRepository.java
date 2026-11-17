package com.cuteness.backend.repository;

import com.cuteness.backend.entity.Signalement;
import com.cuteness.backend.entity.User;
import com.cuteness.backend.enums.StatutSignalement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SignalementRepository extends JpaRepository<Signalement, Long> {
    List<Signalement> findAllByOrderByDateCreationDesc();
    List<Signalement> findByStatutNot(StatutSignalement statut);
    List<Signalement> findByCreatedByOrderByDateCreationDesc(User createdBy);
}
