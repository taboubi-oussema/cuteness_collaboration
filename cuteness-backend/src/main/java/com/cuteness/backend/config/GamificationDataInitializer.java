package com.cuteness.backend.config;

import com.cuteness.backend.entity.GradeConfig;
import com.cuteness.backend.entity.PointsSourceConfig;
import com.cuteness.backend.enums.GradeNiveau;
import com.cuteness.backend.enums.PointsSourceType;
import com.cuteness.backend.enums.RewardType;
import com.cuteness.backend.repository.GradeConfigRepository;
import com.cuteness.backend.repository.PointsSourceConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class GamificationDataInitializer implements CommandLineRunner {

    private final GradeConfigRepository        gradeConfigRepository;
    private final PointsSourceConfigRepository pointsSourceConfigRepository;

    @Override
    public void run(String... args) {
        initGradeConfigs();
        initPointsSourceConfigs();
    }

    private void initGradeConfigs() {
        log.info("Ensuring grade configs are present...");
        seedGrade(GradeNiveau.STARTER,   0,     null,                      0,    0,  "Bienvenue chez Cuteness Collaboration !");
        seedGrade(GradeNiveau.BRONZE,    1000,  RewardType.BADGE,          0,    0,  "Badge Bronze débloqué ! Continuez à progresser.");
        seedGrade(GradeNiveau.SILVER,    3000,  RewardType.REDUCTION_POURCENT, 5, 7, "5% de réduction sur vos commandes pendant 7 jours !");
        seedGrade(GradeNiveau.GOLD,      7000,  RewardType.COMMISSION_BOOST, 0.5, 7, "+0.5% de commission supplémentaire pendant 7 jours !");
        seedGrade(GradeNiveau.PLATINUM,  15000, RewardType.COMMISSION_BOOST, 1.0, 14, "+1% de commission supplémentaire pendant 14 jours !");
        seedGrade(GradeNiveau.DIAMOND,   30000, RewardType.TIRAGE_SORT,    1,   30, "Tirage au sort exclusif Diamond — cadeau premium garanti !");
        log.info("Grade configs ready.");
    }

    private void seedGrade(GradeNiveau niveau, int pointsMin, RewardType rewardType,
                           double rewardValeur, int rewardDureeJours, String rewardDesc) {
        if (gradeConfigRepository.findByGrade(niveau).isEmpty()) {
            gradeConfigRepository.save(GradeConfig.builder()
                    .grade(niveau)
                    .pointsMin(pointsMin)
                    .rewardType(rewardType)
                    .rewardValeur(rewardValeur)
                    .rewardDureeJours(rewardDureeJours)
                    .rewardDescription(rewardDesc)
                    .build());
            log.info("Inserted GradeConfig: {}", niveau);
        }
    }

    private void initPointsSourceConfigs() {
        log.info("Ensuring points source configs are present...");
        seedSource(PointsSourceType.PARRAINAGE,     50,  "Points gagnés par nouveau filleul actif");
        seedSource(PointsSourceType.COMMANDE_LIVREE, 20, "Points gagnés par commande livrée");
        seedSource(PointsSourceType.FORMATION,       5,  "Points gagnés par formation complétée");
        seedSource(PointsSourceType.ACHAT_PACK,      100, "Points gagnés à l'achat d'un pack");
        log.info("Points source configs ready.");
    }

    private void seedSource(PointsSourceType type, int pts, String desc) {
        if (pointsSourceConfigRepository.findBySourceType(type).isEmpty()) {
            pointsSourceConfigRepository.save(
                PointsSourceConfig.builder()
                    .sourceType(type)
                    .pointsParAction(pts)
                    .description(desc)
                    .actif(true)
                    .build()
            );
            log.info("Inserted PointsSourceConfig: {}", type);
        }
    }
}
