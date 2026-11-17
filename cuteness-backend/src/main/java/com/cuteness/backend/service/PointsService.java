package com.cuteness.backend.service;

import com.cuteness.backend.entity.*;
import com.cuteness.backend.enums.GradeNiveau;
import com.cuteness.backend.enums.PointsSourceType;
import com.cuteness.backend.enums.Role;
import com.cuteness.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PointsService {

    private final PartnerPointsRepository      partnerPointsRepository;
    private final UserRepository               userRepository;
    private final NotificationService          notificationService;
    private final GradeConfigRepository        gradeConfigRepository;
    private final PointsSourceConfigRepository pointsSourceConfigRepository;
    private final PointsHistoriqueRepository   pointsHistoriqueRepository;
    private final PartnerRewardRepository      partnerRewardRepository;

    // ── Core point award ─────────────────────────────────────────────────────

    @Transactional
    public void ajouterPointsSource(User partenaire, PointsSourceType sourceType, Long sourceId) {
        if (partenaire == null || partenaire.getRole() != Role.PARTENAIRE) return;

        int pts = pointsSourceConfigRepository.findBySourceType(sourceType)
                .filter(PointsSourceConfig::isActif)
                .map(PointsSourceConfig::getPointsParAction)
                .orElse(0);

        if (pts <= 0) return;

        String desc = pointsSourceConfigRepository.findBySourceType(sourceType)
                .map(PointsSourceConfig::getDescription)
                .orElse(sourceType.name());

        // Classic action only: add to grade total, NOT to challenge counter
        ajouterPointsInterne(partenaire, pts, sourceType, sourceId, desc, true, false);
    }

    /**
     * Award challenge points.
     * @param addToTotal true when classic config also covers this action (both case)
     *                   false when challenge is the only source (challenge-only case)
     */
    @Transactional
    public void ajouterPointsChallenge(User partenaire, int pts, Long conditionId,
                                       String description, boolean addToTotal) {
        if (partenaire == null || partenaire.getRole() != Role.PARTENAIRE) return;
        if (pts <= 0) return;
        ajouterPointsInterne(partenaire, pts, PointsSourceType.CHALLENGE, conditionId,
                description, addToTotal, true);
    }

    /** Legacy call preserved for existing code that already computed the point value */
    @Transactional
    public void ajouterPoints(User partenaire, int pts) {
        if (partenaire == null || partenaire.getRole() != Role.PARTENAIRE) return;
        ajouterPointsInterne(partenaire, pts, PointsSourceType.CHALLENGE, null,
                "Points challenge", true, true);
    }

    /** Returns true if an active classic PointsSourceConfig exists for this source type. */
    public boolean hasClassicConfig(PointsSourceType sourceType) {
        if (sourceType == null) return false;
        return pointsSourceConfigRepository.findBySourceType(sourceType)
                .map(PointsSourceConfig::isActif)
                .orElse(false);
    }

    // ── Internal helper ───────────────────────────────────────────────────────

    /**
     * @param addToTotal     add pts to pointsTotal (affects grade progression)
     * @param addToChallenge add pts to pointsChallenge counter
     */
    private void ajouterPointsInterne(User partenaire, int pts, PointsSourceType sourceType,
                                      Long sourceId, String description,
                                      boolean addToTotal, boolean addToChallenge) {
        PartnerPoints pp = partnerPointsRepository.findByPartenaire(partenaire)
                .orElseGet(() -> PartnerPoints.builder().partenaire(partenaire).build());

        GradeNiveau ancienGrade = pp.getGrade();

        if (addToTotal)     pp.setPointsTotal(pp.getPointsTotal() + pts);
        if (addToChallenge) pp.setPointsChallenge(pp.getPointsChallenge() + pts);

        List<GradeConfig> configs = gradeConfigRepository.findAllByOrderByPointsMinAsc();
        // Recalculate grade only when total changed
        GradeNiveau nouveauGrade = addToTotal
                ? calculerGradeDepuisConfigs(pp.getPointsTotal(), configs)
                : pp.getGrade();
        pp.setGrade(nouveauGrade);
        partnerPointsRepository.save(pp);

        // Log history
        pointsHistoriqueRepository.save(PointsHistorique.builder()
                .partenaire(partenaire)
                .points(pts)
                .sourceType(sourceType)
                .sourceId(sourceId)
                .description(description)
                .build());

        // Grade up reward only when grade total actually changed
        if (addToTotal && nouveauGrade.ordinal() > ancienGrade.ordinal()) {
            try {
                notificationService.notifierGradeUp(partenaire, nouveauGrade);
            } catch (Exception e) {
                log.warn("Grade-up notification failed for {}: {}", partenaire.getEmail(), e.getMessage());
            }
            creerRecompenseGrade(partenaire, nouveauGrade);
            log.info("Partner {} upgraded to grade {}", partenaire.getEmail(), nouveauGrade);
        }
    }

    // ── Grade calculation (dynamic) ───────────────────────────────────────────

    public GradeNiveau calculerGrade(int points) {
        List<GradeConfig> configs = gradeConfigRepository.findAllByOrderByPointsMinAsc();
        return calculerGradeDepuisConfigs(points, configs);
    }

    private GradeNiveau calculerGradeDepuisConfigs(int points, List<GradeConfig> configs) {
        GradeNiveau result = GradeNiveau.STARTER;
        for (GradeConfig cfg : configs) {
            if (points >= cfg.getPointsMin()) {
                result = cfg.getGrade();
            }
        }
        return result;
    }

    public int pointsProchainGrade(int currentPoints) {
        List<GradeConfig> configs = gradeConfigRepository.findAllByOrderByPointsMinAsc();
        for (GradeConfig cfg : configs) {
            if (currentPoints < cfg.getPointsMin()) {
                return cfg.getPointsMin() - currentPoints;
            }
        }
        return 0;
    }

    public int seuilProchainGrade(int currentPoints) {
        List<GradeConfig> configs = gradeConfigRepository.findAllByOrderByPointsMinAsc();
        for (GradeConfig cfg : configs) {
            if (currentPoints < cfg.getPointsMin()) {
                return cfg.getPointsMin();
            }
        }
        return configs.isEmpty() ? 0 : configs.get(configs.size() - 1).getPointsMin();
    }

    // ── Partner reward creation ───────────────────────────────────────────────

    private void creerRecompenseGrade(User partenaire, GradeNiveau grade) {
        gradeConfigRepository.findByGrade(grade).ifPresent(cfg -> {
            if (cfg.getRewardType() == null) return;
            LocalDate today = LocalDate.now();
            PartnerReward reward = PartnerReward.builder()
                    .partenaire(partenaire)
                    .type(cfg.getRewardType())
                    .valeur(cfg.getRewardValeur())
                    .dateDebut(today)
                    .dateFin(cfg.getRewardDureeJours() > 0
                            ? today.plusDays(cfg.getRewardDureeJours()) : null)
                    .source("GRADE_" + grade.name())
                    .description(cfg.getRewardDescription())
                    .build();
            partnerRewardRepository.save(reward);
        });
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> getMesPoints(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        PartnerPoints pp = partnerPointsRepository.findByPartenaire(user)
                .orElseGet(() -> PartnerPoints.builder().partenaire(user).build());

        // Recalculate grade in case configs were empty when points were first awarded
        List<GradeConfig> configs = gradeConfigRepository.findAllByOrderByPointsMinAsc();
        if (!configs.isEmpty()) {
            GradeNiveau correctGrade = calculerGradeDepuisConfigs(pp.getPointsTotal(), configs);
            if (correctGrade != pp.getGrade()) {
                pp.setGrade(correctGrade);
                if (pp.getId() != null) partnerPointsRepository.save(pp);
            }
        }

        int pts         = pp.getPointsTotal();
        int seuil       = seuilProchainGrade(pts);
        int restant     = pointsProchainGrade(pts);
        int seuilActuel = seuilGradeActuel(pp.getGrade());
        int progressPct = seuil > seuilActuel
                ? (int) (((double) (pts - seuilActuel) / (seuil - seuilActuel)) * 100)
                : 100;

        List<Map<String, Object>> historique = pointsHistoriqueRepository
                .findTop20ByPartenaireOrderByDateCreationDesc(user)
                .stream()
                .map(h -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("points",      h.getPoints());
                    m.put("sourceType",  h.getSourceType());
                    m.put("description", h.getDescription());
                    m.put("date",        h.getDateCreation());
                    return m;
                })
                .collect(Collectors.toList());

        List<Map<String, Object>> recompenses = partnerRewardRepository
                .findByPartenaireAndActiveTrue(user)
                .stream()
                .filter(r -> r.getDateFin() == null || !r.getDateFin().isBefore(LocalDate.now()))
                .map(r -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id",          r.getId());
                    m.put("type",        r.getType());
                    m.put("valeur",      r.getValeur());
                    m.put("dateDebut",   r.getDateDebut());
                    m.put("dateFin",     r.getDateFin());
                    m.put("source",      r.getSource());
                    m.put("description", r.getDescription());
                    return m;
                })
                .collect(Collectors.toList());

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("pointsTotal",         pts);
        res.put("pointsChallenge",     pp.getPointsChallenge());
        res.put("grade",               pp.getGrade());
        res.put("pointsProchainGrade", restant);
        res.put("seuilProchainGrade",  seuil);
        res.put("progressPct",         Math.min(progressPct, 100));
        res.put("historique",          historique);
        res.put("recompensesActives",  recompenses);
        return res;
    }

    public List<Map<String, Object>> getLeaderboard() {
        return partnerPointsRepository.findTopByOrderByPointsTotalDesc()
                .stream()
                .limit(10)
                .map(pp -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("nom",           pp.getPartenaire().getNom());
                    m.put("pointsTotal",   pp.getPointsTotal());
                    m.put("grade",         pp.getGrade());
                    return m;
                })
                .collect(Collectors.toList());
    }

    private int seuilGradeActuel(GradeNiveau grade) {
        return gradeConfigRepository.findByGrade(grade)
                .map(GradeConfig::getPointsMin)
                .orElse(0);
    }
}
