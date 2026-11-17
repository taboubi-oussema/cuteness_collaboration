package com.cuteness.backend.repository;

import com.cuteness.backend.entity.PartnerReward;
import com.cuteness.backend.entity.User;
import com.cuteness.backend.enums.RewardType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface PartnerRewardRepository extends JpaRepository<PartnerReward, Long> {
    List<PartnerReward> findByPartenaireAndActiveTrue(User partenaire);

    @Query("SELECT r FROM PartnerReward r WHERE r.partenaire = :partenaire AND r.active = true AND r.type = :type AND r.dateFin >= :today")
    List<PartnerReward> findActiveByPartenaireAndType(User partenaire, RewardType type, LocalDate today);

    @Query("SELECT r FROM PartnerReward r WHERE r.active = true AND r.dateFin < :today")
    List<PartnerReward> findExpiredRewards(LocalDate today);
}
