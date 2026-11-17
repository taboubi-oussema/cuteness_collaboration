package com.cuteness.backend.service;

import com.cuteness.backend.entity.PartnerReward;
import com.cuteness.backend.entity.User;
import com.cuteness.backend.enums.RewardType;
import com.cuteness.backend.repository.PartnerRewardRepository;
import com.cuteness.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PartnerRewardService {

    private final PartnerRewardRepository partnerRewardRepository;
    private final UserRepository          userRepository;

    public List<Map<String, Object>> getMesRecompenses(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        LocalDate today = LocalDate.now();
        return partnerRewardRepository.findByPartenaireAndActiveTrue(user).stream()
                .filter(r -> r.getDateFin() == null || !r.getDateFin().isBefore(today))
                .map(this::toMap)
                .collect(Collectors.toList());
    }

    /** Retourne le pourcentage de boost de commission actif pour un partenaire (somme de tous les boosts actifs) */
    public double getCommissionBoost(User partenaire) {
        return partnerRewardRepository
                .findActiveByPartenaireAndType(partenaire, RewardType.COMMISSION_BOOST, LocalDate.now())
                .stream()
                .mapToDouble(PartnerReward::getValeur)
                .sum();
    }

    /** Retourne le pourcentage de réduction actif pour un partenaire */
    public double getReductionBoost(User partenaire) {
        return partnerRewardRepository
                .findActiveByPartenaireAndType(partenaire, RewardType.REDUCTION_POURCENT, LocalDate.now())
                .stream()
                .mapToDouble(PartnerReward::getValeur)
                .sum();
    }

    @Transactional
    public void expireRecompensesTerminees() {
        partnerRewardRepository.findExpiredRewards(LocalDate.now())
                .forEach(r -> r.setActive(false));
    }

    private Map<String, Object> toMap(PartnerReward r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",          r.getId());
        m.put("type",        r.getType());
        m.put("valeur",      r.getValeur());
        m.put("dateDebut",   r.getDateDebut());
        m.put("dateFin",     r.getDateFin());
        m.put("source",      r.getSource());
        m.put("description", r.getDescription());
        m.put("active",      r.isActive());
        return m;
    }
}
