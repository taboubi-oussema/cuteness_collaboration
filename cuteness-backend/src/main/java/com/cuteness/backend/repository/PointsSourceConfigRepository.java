package com.cuteness.backend.repository;

import com.cuteness.backend.entity.PointsSourceConfig;
import com.cuteness.backend.enums.PointsSourceType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PointsSourceConfigRepository extends JpaRepository<PointsSourceConfig, Long> {
    Optional<PointsSourceConfig> findBySourceType(PointsSourceType sourceType);
}
