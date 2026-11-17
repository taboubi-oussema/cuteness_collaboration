package com.cuteness.backend.repository;

import com.cuteness.backend.entity.PointsHistorique;
import com.cuteness.backend.entity.User;
import com.cuteness.backend.enums.PointsSourceType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PointsHistoriqueRepository extends JpaRepository<PointsHistorique, Long> {
    List<PointsHistorique> findByPartenaireOrderByDateCreationDesc(User partenaire);
    List<PointsHistorique> findTop20ByPartenaireOrderByDateCreationDesc(User partenaire);
    boolean existsByPartenaireAndSourceTypeAndSourceId(User partenaire, PointsSourceType sourceType, Long sourceId);
}
