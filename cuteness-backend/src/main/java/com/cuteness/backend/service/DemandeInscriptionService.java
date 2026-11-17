package com.cuteness.backend.service;

import com.cuteness.backend.entity.DemandeInscription;
import com.cuteness.backend.entity.User;
import com.cuteness.backend.enums.ChallengeType;
import com.cuteness.backend.enums.PointsSourceType;
import com.cuteness.backend.enums.Role;
import com.cuteness.backend.enums.StatutDemande;
import com.cuteness.backend.repository.DemandeInscriptionRepository;
import com.cuteness.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DemandeInscriptionService {

    private final DemandeInscriptionRepository demandeRepository;
    private final UserRepository               userRepository;
    private final NotificationService          notificationService;
    private final MLMCommissionService         mlmCommissionService;
    private final NavexService                 navexService;
    private final PointsService                pointsService;
    private final ChallengeService             challengeService;

    // ── Called from AuthService after new user is saved ────────────────
    @Transactional
    public void creerDemande(User utilisateur) {
        DemandeInscription demande = DemandeInscription.builder()
                .utilisateur(utilisateur)
                .parrain(utilisateur.getParrain())
                .build();
        demandeRepository.save(demande);

        String nomParrain = utilisateur.getParrain() != null
                ? utilisateur.getParrain().getNom() : "sans parrain";

        // Notify every supervisor
        List<User> superviseurs = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.SUPERVISEUR && u.isStatut())
                .collect(Collectors.toList());

        superviseurs.forEach(s ->
                notificationService.notifierNouvelleInscription(s, utilisateur.getNom(), nomParrain));

        log.info("DemandeInscription créée pour {} — {} superviseurs notifiés",
                utilisateur.getNom(), superviseurs.size());
    }

    // ── Supervisor claims the request ───────────────────────────────────
    @Transactional
    public Map<String, Object> prendreEnCharge(Long id, String emailSuperviseur) {
        DemandeInscription demande = demandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));

        if (demande.getStatut() != StatutDemande.NOUVELLE)
            throw new RuntimeException("Demande déjà prise en charge ou traitée");

        User superviseur = userRepository.findByEmail(emailSuperviseur)
                .orElseThrow(() -> new RuntimeException("Superviseur introuvable"));

        demande.setStatut(StatutDemande.EN_COURS);
        demande.setSuperviseur(superviseur);
        demande.setDatePriseEnCharge(LocalDateTime.now());
        demandeRepository.save(demande);

        // Notify all OTHER supervisors that this is taken
        userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.SUPERVISEUR && u.isStatut()
                        && u.getId() != superviseur.getId())
                .forEach(s -> notificationService.notifierDemandePriseEnCharge(
                        s, demande.getUtilisateur().getNom(), superviseur.getNom()));

        return toMap(demande);
    }

    // ── Supervisor marks as processed ───────────────────────────────────
    @Transactional
    public Map<String, Object> marquerTraitee(Long id, String emailSuperviseur) {
        DemandeInscription demande = demandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));

        User superviseur = userRepository.findByEmail(emailSuperviseur)
                .orElseThrow(() -> new RuntimeException("Superviseur introuvable"));

        if (demande.getStatut() != StatutDemande.EN_COURS
                || demande.getSuperviseur().getId() != superviseur.getId())
            throw new RuntimeException("Vous n'êtes pas le superviseur de cette demande");

        demande.setStatut(StatutDemande.TRAITEE);
        demande.setDateTraitement(LocalDateTime.now());
        demandeRepository.save(demande);

        // Notify all comptables
        userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.COMPTABLE && u.isStatut())
                .forEach(c -> notificationService.notifierDemandeATraiter(
                        c, demande.getUtilisateur().getNom()));

        return toMap(demande);
    }

    // ── Comptable marks as delivered ────────────────────────────────────
    @Transactional
    public Map<String, Object> marquerLivree(Long id) {
        DemandeInscription demande = demandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));

        if (demande.getStatut() != StatutDemande.TRAITEE)
            throw new RuntimeException("La demande doit être à l'état TRAITEE");

        demande.setStatut(StatutDemande.LIVREE);
        demande.setDateLivraison(LocalDateTime.now());
        demandeRepository.save(demande);

        User client = demande.getUtilisateur();
        String nomParrain = demande.getParrain() != null
                ? demande.getParrain().getNom() : "sans parrain";

        // Auto-calculate MLM commission for parrain (if client has a pack)
        if (client.getPack() != null) {
            mlmCommissionService.calculerCommissionsSurAchatPack(client, client.getPack());
            challengeService.processerEvent(client, ChallengeType.ACHAT_PACK, PointsSourceType.ACHAT_PACK, null);
        }

        // Award parrain points for new filleul + challenge progress
        if (client.getParrain() != null) {
            challengeService.processerEvent(client.getParrain(), ChallengeType.PARRAINAGE,
                    PointsSourceType.PARRAINAGE, (long) client.getId());
            notificationService.notifierNouveauFilleul(client.getParrain(), client.getNom());
        }

        // Notify all admins to approve the new account
        userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ADMIN && u.isStatut())
                .forEach(admin -> notificationService.notifierApprouverCompte(
                        admin, client, nomParrain));

        log.info("DemandeInscription LIVREE pour {} — admin notifié pour approbation", client.getNom());
        return toMap(demande);
    }

    // ── Create Navex shipment ────────────────────────────────────────────
    @Transactional
    public Map<String, Object> creerColisNavex(Long id) {
        DemandeInscription demande = demandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));

        if (demande.getStatut() != StatutDemande.TRAITEE)
            throw new RuntimeException("La demande doit être à l'état TRAITEE pour créer un colis");

        User client = demande.getUtilisateur();
        String prix = client.getPack() != null
                ? String.valueOf((int) client.getPack().getPrix()) : "0";
        String designation = client.getPack() != null
                ? "Pack " + client.getPack().getNom() : "Pack Cuteness";

        String ref = navexService.creerColis(
                client.getNom(),
                client.getRegion(),
                client.getRegion(),
                client.getTelephone(),
                designation,
                prix);

        if (ref == null)
            throw new RuntimeException("Erreur lors de la création du colis chez Navex");

        demande.setNavexRef(ref);
        demandeRepository.save(demande);

        log.info("Navex colis créé pour {} — ref: {}", client.getNom(), ref);
        return toMap(demande);
    }

    // ── Getters ─────────────────────────────────────────────────────────

    public List<Map<String, Object>> getDemandes() {
        return demandeRepository.findAll().stream()
                .sorted((a, b) -> b.getDateCreation().compareTo(a.getDateCreation()))
                .map(this::toMap)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getDemandesForSuperviseur(String email) {
        User superviseur = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Superviseur introuvable"));

        return demandeRepository.findAll().stream()
                .filter(d -> d.getStatut() == StatutDemande.NOUVELLE
                        || d.getStatut() == StatutDemande.EN_COURS
                        || (d.getStatut() == StatutDemande.TRAITEE
                                && d.getSuperviseur() != null
                                && d.getSuperviseur().getId() == superviseur.getId()))
                .sorted((a, b) -> b.getDateCreation().compareTo(a.getDateCreation()))
                .map(this::toMap)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getDemandesTraitees() {
        return demandeRepository.findByStatut(StatutDemande.TRAITEE).stream()
                .sorted((a, b) -> b.getDateTraitement().compareTo(a.getDateTraitement()))
                .map(this::toMap)
                .collect(Collectors.toList());
    }

    // ── Mapper ───────────────────────────────────────────────────────────
    private Map<String, Object> toMap(DemandeInscription d) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", d.getId());
        m.put("statut", d.getStatut().name());
        m.put("dateCreation", d.getDateCreation());
        m.put("datePriseEnCharge", d.getDatePriseEnCharge());
        m.put("dateTraitement", d.getDateTraitement());
        m.put("dateLivraison", d.getDateLivraison());

        User u = d.getUtilisateur();
        m.put("userId", u.getId());
        m.put("nomClient", u.getNom());
        m.put("emailClient", u.getEmail());
        m.put("telephone", u.getTelephone());
        m.put("region", u.getRegion());
        m.put("nomPack", u.getPack() != null ? u.getPack().getNom() : "Aucun");
        m.put("prixPack", u.getPack() != null ? u.getPack().getPrix() : 0.0);
        m.put("modePaiement", u.getModePaiement());

        m.put("nomParrain", d.getParrain() != null ? d.getParrain().getNom() : "—");
        m.put("codeParrainage", u.getCodeParrainage());
        m.put("nomSuperviseur", d.getSuperviseur() != null ? d.getSuperviseur().getNom() : null);
        m.put("navexRef", d.getNavexRef());

        return m;
    }
}
