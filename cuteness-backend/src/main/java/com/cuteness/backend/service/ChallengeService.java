package com.cuteness.backend.service;

import com.cuteness.backend.entity.*;
import com.cuteness.backend.enums.ChallengeType;
import com.cuteness.backend.enums.PointsSourceType;
import com.cuteness.backend.enums.Role;
import com.cuteness.backend.repository.*;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChallengeService {

    private final ChallengeRepository                  challengeRepository;
    private final ChallengeParticipationRepository     participationRepository;
    private final ChallengeConditionRepository         conditionRepository;
    private final ChallengeConditionProgressRepository conditionProgressRepository;
    private final UserRepository                       userRepository;
    private final PointsService                        pointsService;
    private final NotificationService                  notificationService;

    

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllChallenges() {
        return challengeRepository.findAllWithConditions().stream()
                .map(this::toMap).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getActiveChallenges() {
        // Retourne tous les challenges actifs=true (y compris ceux à venir).
        // Le frontend affiche un badge «à venir» quand dateDebut est dans le futur.
        // Les contraintes de date ne sont appliquées qu'au moment de la participation.
        LocalDate today = LocalDate.now();
        return challengeRepository.findByActifTrueWithConditions().stream()
                .filter(c -> c.getDateFin() == null || !c.getDateFin().isBefore(today))
                .map(c -> {
                    Map<String, Object> m = toMap(c);
                    boolean ouvert = c.getDateDebut() == null || !c.getDateDebut().isAfter(today);
                    m.put("ouvert", ouvert);
                    return m;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> createChallenge(Map<String, Object> body) {
        Challenge saved = challengeRepository.save(Challenge.builder()
                .titre((String) body.get("titre"))
                .description((String) body.get("description"))
                .imageUrl((String) body.get("imageUrl"))
                .recompenseDescription((String) body.get("recompenseDescription"))
                .actif(body.get("actif") == null ? true : Boolean.TRUE.equals(body.get("actif")))
                .dateDebut(parseDate(body.get("dateDebut")))
                .dateFin(parseDate(body.get("dateFin")))
                .build());

        saveConditions(saved, body);
        return challengeRepository.findByIdWithConditions(saved.getId())
                .map(this::toMap)
                .orElseGet(() -> toMap(saved));
    }

    @Transactional
    public Map<String, Object> updateChallenge(Long id, Map<String, Object> body) {
        Challenge c = challengeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Challenge introuvable"));

        if (body.containsKey("titre"))                 c.setTitre((String) body.get("titre"));
        if (body.containsKey("description"))           c.setDescription((String) body.get("description"));
        if (body.containsKey("imageUrl"))              c.setImageUrl((String) body.get("imageUrl"));
        if (body.containsKey("recompenseDescription")) c.setRecompenseDescription((String) body.get("recompenseDescription"));
        if (body.containsKey("actif"))                 c.setActif(Boolean.TRUE.equals(body.get("actif")));
        if (body.containsKey("dateDebut"))             c.setDateDebut(parseDate(body.get("dateDebut")));
        if (body.containsKey("dateFin"))               c.setDateFin(parseDate(body.get("dateFin")));

        final Challenge updated = challengeRepository.save(c);

        if (body.containsKey("conditions")) {
            // Delete progress records first (FK: progress → condition), then conditions
            conditionProgressRepository.deleteByConditionChallengeId(updated.getId());
            conditionRepository.deleteByChallengeId(updated.getId());
            saveConditions(updated, body);
        }

        return challengeRepository.findByIdWithConditions(updated.getId())
                .map(this::toMap)
                .orElseGet(() -> toMap(updated));
    }

    @Transactional
    public void deleteChallenge(Long id) {
        challengeRepository.deleteById(id);
    }

    

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMesParticipations(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        return participationRepository.findByPartenaire(user).stream()
                .map(p -> participationToMap(p, true))
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> participer(Long challengeId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        Challenge challenge = challengeRepository.findById(challengeId)
                .orElseThrow(() -> new RuntimeException("Challenge introuvable"));

        LocalDate today = LocalDate.now();
        if (challenge.getDateDebut() != null && challenge.getDateDebut().isAfter(today))
            throw new RuntimeException("Ce challenge n'a pas encore commencé");
        if (challenge.getDateFin() != null && challenge.getDateFin().isBefore(today))
            throw new RuntimeException("Ce challenge est terminé");

        // Idempotent : retourne la participation existante si déjà inscrite
        Optional<ChallengeParticipation> existing = participationRepository
                .findByPartenaireAndChallenge(user, challenge);
        if (existing.isPresent()) {
            return participationToMap(existing.get(), true);
        }

        ChallengeParticipation p = participationRepository.save(
                ChallengeParticipation.builder().partenaire(user).challenge(challenge).build());

        List<ChallengeCondition> conditions = conditionRepository.findByChallengeOrderByOrdreAsc(challenge);
        for (ChallengeCondition cond : conditions) {
            conditionProgressRepository.save(
                    ChallengeConditionProgress.builder().participation(p).condition(cond).build());
        }

        return participationToMap(p, true);
    }

    
    @Transactional
    public void processerEvent(User partenaire, ChallengeType type,
                               PointsSourceType sourceType, Long sourceId) {
        boolean challengeCovers = hasActiveChallengeForType(type);
        boolean classicCovers   = pointsService.hasClassicConfig(sourceType);

        // When both exist, challenge points count for grade too (addToTotal=true)
        onEventParPartenaire(partenaire, type, 1, classicCovers && challengeCovers);

        // Classic-only case: award grade points through the standard path
        if (!challengeCovers && classicCovers) {
            pointsService.ajouterPointsSource(partenaire, sourceType, sourceId);
        }
    }

    public boolean hasActiveChallengeForType(ChallengeType type) {
        LocalDate today = LocalDate.now();
        return challengeRepository.findByActifTrueWithConditions().stream()
                .anyMatch(c -> (c.getDateFin() == null || !c.getDateFin().isBefore(today))
                            && (c.getDateDebut() == null || !c.getDateDebut().isAfter(today))
                            && c.getConditions().stream().anyMatch(cond -> cond.getType() == type));
    }

    /** Backward-compat overload for direct callers (COMMISSION, retrigger) — challenge-only, no grade impact. */
    @Transactional
    public void onEventParPartenaire(User partenaire, ChallengeType eventType, int valeur) {
        onEventParPartenaire(partenaire, eventType, valeur, false);
    }

    @Transactional
    public void onEventParPartenaire(User partenaire, ChallengeType eventType, int valeur, boolean addToTotal) {
        LocalDate today = LocalDate.now();

        List<Challenge> actifs = challengeRepository.findByActifTrueWithConditions()
                .stream()
                .filter(c -> (c.getDateDebut() == null || !c.getDateDebut().isAfter(today))
                          && (c.getDateFin()   == null || !c.getDateFin().isBefore(today)))
                .collect(Collectors.toList());

        for (Challenge challenge : actifs) {
            List<ChallengeCondition> matchingConditions = challenge.getConditions().stream()
                    .filter(c -> c.getType() == eventType)
                    .collect(Collectors.toList());

            if (matchingConditions.isEmpty()) continue;

            ChallengeParticipation part = participationRepository
                    .findByPartenaireAndChallenge(partenaire, challenge)
                    .orElseGet(() -> {
                        ChallengeParticipation p = participationRepository.save(
                                ChallengeParticipation.builder()
                                        .partenaire(partenaire)
                                        .challenge(challenge)
                                        .build());
                        for (ChallengeCondition cond : challenge.getConditions()) {
                            conditionProgressRepository.save(
                                    ChallengeConditionProgress.builder()
                                            .participation(p)
                                            .condition(cond)
                                            .build());
                        }
                        return p;
                    });

            if (part.isComplete()) continue;

            for (ChallengeCondition cond : matchingConditions) {
                progresserCondition(part, cond, valeur, addToTotal);
            }

            checkChallengeComplete(part);
        }
    }

    

    @SuppressWarnings("unchecked")
    private void saveConditions(Challenge challenge, Map<String, Object> body) {
        Object raw = body.get("conditions");
        if (!(raw instanceof List)) return;
        List<Map<String, Object>> condList = (List<Map<String, Object>>) raw;
        int ordre = 0;
        for (Map<String, Object> c : condList) {
            conditionRepository.save(ChallengeCondition.builder()
                    .challenge(challenge)
                    .type(ChallengeType.valueOf((String) c.get("type")))
                    .objectifValeur(toInt(c.get("objectifValeur")))
                    .pointsRecompense(toInt(c.get("pointsRecompense")))
                    .description((String) c.get("description"))
                    .ordre(ordre++)
                    .build());
        }
    }

    private void progresserCondition(ChallengeParticipation participation,
                                     ChallengeCondition condition, int increment, boolean addToTotal) {
        ChallengeConditionProgress progress = conditionProgressRepository
                .findByParticipationAndCondition(participation, condition)
                .orElseGet(() -> ChallengeConditionProgress.builder()
                        .participation(participation).condition(condition).build());

        if (progress.isComplete()) return;

        progress.setProgression(progress.getProgression() + increment);

        if (progress.getProgression() >= condition.getObjectifValeur()) {
            progress.setComplete(true);
            progress.setDateCompletion(LocalDateTime.now());

            int pts = condition.getPointsRecompense() - progress.getPointsGagnes();
            if (pts > 0) {
                progress.setPointsGagnes(condition.getPointsRecompense());
                pointsService.ajouterPointsChallenge(
                        participation.getPartenaire(),
                        pts,
                        condition.getId(),
                        condition.getDescription(),
                        addToTotal);
            }
        }
        conditionProgressRepository.save(progress);
    }

    private void checkChallengeComplete(ChallengeParticipation participation) {
        List<ChallengeCondition> allConds = conditionRepository
                .findByChallengeOrderByOrdreAsc(participation.getChallenge());
        if (allConds.isEmpty()) return;

        List<ChallengeConditionProgress> progresses = conditionProgressRepository
                .findByParticipation(participation);

        boolean allDone = allConds.stream().allMatch(cond ->
                progresses.stream().anyMatch(p ->
                        p.getCondition().getId().equals(cond.getId()) && p.isComplete()));

        if (allDone && !participation.isComplete()) {
            participation.setComplete(true);
            participation.setDateCompletion(LocalDateTime.now());
            participationRepository.save(participation);

            String nomPartenaire = participation.getPartenaire().getNom();
            String titreChallenge = participation.getChallenge().getTitre();

            // Notify the partner (félicitations)
            try {
                notificationService.notifierChallengeComplete(participation.getPartenaire(), titreChallenge);
            } catch (Exception e) {
                log.warn("Challenge complete notification (partner) failed for {}: {}", nomPartenaire, e.getMessage());
            }

            // Notify all admins
            try {
                userRepository.findByRole(Role.ADMIN).forEach(admin ->
                        notificationService.notifierChallengeCompleteAdmin(admin, nomPartenaire, titreChallenge));
            } catch (Exception e) {
                log.warn("Challenge complete notification (admin) failed: {}", e.getMessage());
            }

            log.info("Partner {} completed challenge '{}'", nomPartenaire, titreChallenge);
        }
    }

    private Map<String, Object> toMap(Challenge c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",                    c.getId());
        m.put("titre",                 c.getTitre());
        m.put("description",           c.getDescription());
        m.put("imageUrl",              c.getImageUrl());
        m.put("recompenseDescription", c.getRecompenseDescription());
        m.put("dateDebut",             c.getDateDebut());
        m.put("dateFin",               c.getDateFin());
        m.put("actif",                 c.isActif());
        m.put("conditions",            c.getConditions().stream().map(this::conditionToMap).collect(Collectors.toList()));
        int totalPoints = c.getConditions().stream().mapToInt(ChallengeCondition::getPointsRecompense).sum();
        m.put("pointsTotaux",          totalPoints);
        return m;
    }

    private Map<String, Object> conditionToMap(ChallengeCondition cond) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",               cond.getId());
        m.put("type",             cond.getType());
        m.put("objectifValeur",   cond.getObjectifValeur());
        m.put("pointsRecompense", cond.getPointsRecompense());
        m.put("description",      cond.getDescription());
        m.put("ordre",            cond.getOrdre());
        return m;
    }

    private Map<String, Object> participationToMap(ChallengeParticipation p, boolean withProgress) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",             p.getId());
        m.put("challengeId",    p.getChallenge().getId());
        m.put("titre",          p.getChallenge().getTitre());
        m.put("description",    p.getChallenge().getDescription());
        m.put("imageUrl",       p.getChallenge().getImageUrl());
        m.put("recompenseDescription", p.getChallenge().getRecompenseDescription());
        m.put("dateDebut",      p.getChallenge().getDateDebut());
        m.put("dateFin",        p.getChallenge().getDateFin());
        m.put("complete",       p.isComplete());
        m.put("dateCompletion", p.getDateCompletion());

        if (withProgress) {
            List<ChallengeConditionProgress> progresses = conditionProgressRepository.findByParticipation(p);
            List<Map<String, Object>> condProgress = conditionRepository
                    .findByChallengeOrderByOrdreAsc(p.getChallenge())
                    .stream()
                    .map(cond -> {
                        Map<String, Object> cp = new LinkedHashMap<>();
                        cp.put("conditionId",      cond.getId());
                        cp.put("type",             cond.getType());
                        cp.put("description",      cond.getDescription());
                        cp.put("objectifValeur",   cond.getObjectifValeur());
                        cp.put("pointsRecompense", cond.getPointsRecompense());
                        cp.put("ordre",            cond.getOrdre());
                        progresses.stream()
                                .filter(pr -> pr.getCondition().getId().equals(cond.getId()))
                                .findFirst()
                                .ifPresentOrElse(pr -> {
                                    cp.put("progression",    pr.getProgression());
                                    cp.put("complete",       pr.isComplete());
                                    cp.put("dateCompletion", pr.getDateCompletion());
                                    cp.put("pointsGagnes",   pr.getPointsGagnes());
                                }, () -> {
                                    cp.put("progression",    0);
                                    cp.put("complete",       false);
                                    cp.put("dateCompletion", null);
                                    cp.put("pointsGagnes",   0);
                                });
                        return cp;
                    })
                    .collect(Collectors.toList());
            m.put("conditions", condProgress);
            int totalGagnes = progresses.stream().mapToInt(ChallengeConditionProgress::getPointsGagnes).sum();
            m.put("pointsGagnesTotaux", totalGagnes);
        }
        return m;
    }

    private int toInt(Object val) {
        if (val instanceof Number n) return n.intValue();
        if (val instanceof String s) return Integer.parseInt(s);
        return 0;
    }

    private LocalDate parseDate(Object val) {
        if (val == null) return null;
        String s = val.toString().trim();
        return s.isEmpty() ? null : LocalDate.parse(s);
    }
}
