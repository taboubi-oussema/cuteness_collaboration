package com.cuteness.backend.repository;

import com.cuteness.backend.entity.PartnerPoints;
import com.cuteness.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface PartnerPointsRepository extends JpaRepository<PartnerPoints, Long> {

    Optional<PartnerPoints> findByPartenaire(User partenaire);

    @Query("SELECT pp FROM PartnerPoints pp WHERE pp.partenaire.id = :userId")
    Optional<PartnerPoints> findByPartenaireId(@Param("userId") int userId);


    @Query("SELECT pp FROM PartnerPoints pp ORDER BY pp.pointsTotal DESC")
    List<PartnerPoints> findTopByOrderByPointsTotalDesc();
}
