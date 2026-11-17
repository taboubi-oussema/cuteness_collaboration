package com.cuteness.backend.repository;

import com.cuteness.backend.entity.GradeConfig;
import com.cuteness.backend.enums.GradeNiveau;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GradeConfigRepository extends JpaRepository<GradeConfig, Long> {
    Optional<GradeConfig> findByGrade(GradeNiveau grade);
    List<GradeConfig> findAllByOrderByPointsMinAsc();
}
