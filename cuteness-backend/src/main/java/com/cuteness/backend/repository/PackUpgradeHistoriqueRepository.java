package com.cuteness.backend.repository;

import com.cuteness.backend.entity.PackUpgradeHistorique;
import com.cuteness.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PackUpgradeHistoriqueRepository extends JpaRepository<PackUpgradeHistorique, Long> {
    List<PackUpgradeHistorique> findByUserOrderByDateUpgradeDesc(User user);
}
