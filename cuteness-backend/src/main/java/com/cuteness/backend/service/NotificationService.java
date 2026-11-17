package com.cuteness.backend.service;

import com.cuteness.backend.entity.Notification;
import com.cuteness.backend.entity.User;
import com.cuteness.backend.enums.GradeNiveau;
import com.cuteness.backend.repository.NotificationRepository;
import com.cuteness.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    // ── Create & persist a notification ──────────────────
    @Transactional
    public void creer(User destinataire, String titre, String message, String type) {
        creerAvecRef(destinataire, titre, message, type, null);
    }

    @Transactional
    public void creerAvecRef(User destinataire, String titre, String message, String type, Long referenceId) {
        notificationRepository.save(Notification.builder()
                .destinataire(destinataire)
                .titre(titre)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .build());
    }

    // ── Commission EN_ATTENTE ─────────────────────────────
    public void notifierCommissionAttente(User beneficiaire, double montant, int niveau, String sourceLabel) {
        String niveauLabel = niveau == 1 ? "directe" : "niveau " + niveau;
        creer(beneficiaire,
                "💰 Commission " + niveauLabel + " en attente",
                "Commission de " + montant + " DT (" + niveauLabel + ") générée par " + sourceLabel
                        + " — en attente de validation admin.",
                "COMMISSION_ATTENTE");
    }

    // ── Commission approuvée par admin ────────────────────
    public void notifierCommissionValideeAdmin(User beneficiaire, double montant) {
        creer(beneficiaire,
                "✅ Commission approuvée par l'admin",
                "Votre commission de " + montant + " DT est approuvée. "
                        + "En attente de validation finale par le comptable.",
                "COMMISSION_VALIDEE_ADMIN");
    }

    // ── Commission créditée (comptable) ───────────────────
    public void notifierCommissionPayee(User beneficiaire, double montant) {
        creer(beneficiaire,
                "🎉 Commission créditée sur votre solde",
                montant + " DT ont été ajoutés à votre solde interne.",
                "COMMISSION_VALIDEE");
    }

    // ── Commission refusée ────────────────────────────────
    public void notifierCommissionRefusee(User beneficiaire, double montant) {
        creer(beneficiaire,
                "❌ Commission refusée",
                "Votre commission de " + montant + " DT a été refusée.",
                "COMMISSION_REFUSEE");
    }

    // ── Livraison confirmée avec remboursement ────────────
    public void notifierLivraison(User partenaire, String refCommande, double credit, int taux) {
        creer(partenaire,
                "📦 Commande " + refCommande + " livrée",
                "Commande " + refCommande + " livrée. "
                        + credit + " DT crédités sur votre solde (" + taux + "%).",
                "LIVRAISON");
    }

    // ── Virement effectué ────────────────────────────────
    public void notifierVirement(User partenaire, double montant) {
        creer(partenaire,
                "💸 Virement effectué",
                "Un virement de " + montant + " DT a été effectué sur votre compte. "
                        + "Votre solde interne a été remis à zéro.",
                "VIREMENT");
    }

    // ── Commande retournée ────────────────────────────────
    public void notifierRetour(User partenaire, String refCommande) {
        creer(partenaire,
                "🔄 Commande " + refCommande + " retournée",
                "Votre commande " + refCommande + " a été retournée. "
                        + "5 DT ont été débités de votre solde.",
                "RETOUR");
    }

    // ── Livraison confirmée sans remboursement (option IMMEDIATE) ─
    public void notifierLivraisonSansCredit(User partenaire, String refCommande) {
        creer(partenaire,
                "📦 Commande " + refCommande + " livrée",
                "Votre commande " + refCommande + " a été livrée avec succès.",
                "LIVRAISON");
    }

    // ── Commande en préparation ───────────────────────────
    public void notifierEnPreparation(User partenaire, String refCommande) {
        creer(partenaire,
                "🔧 Commande " + refCommande + " en préparation",
                "Votre commande " + refCommande + " est en cours de préparation.",
                "COMMANDE");
    }

    // ── Nouvelle commande produit (superviseurs) ──────────
    public void notifierNouvelleCommande(User superviseur, String nomPartenaire, int commandeId) {
        String ref = "CMD-" + String.format("%03d", commandeId);
        creer(superviseur,
                "📦 Nouvelle commande : " + ref,
                "Le partenaire " + nomPartenaire + " a passé la commande " + ref
                        + ". Veuillez la traiter dès que possible.",
                "COMMANDE_NOUVELLE");
    }

    // ── Nouvelle demande d'inscription (superviseurs) ─────
    public void notifierNouvelleInscription(User superviseur, String nomClient, String nomParrain) {
        creer(superviseur,
                "📋 Nouvelle demande d'inscription",
                nomClient + " vient de s'inscrire via le code de " + nomParrain
                        + ". Prenez en charge cette demande.",
                "INSCRIPTION_NOUVELLE");
    }

    // ── Demande prise en charge par autre superviseur ─────
    public void notifierDemandePriseEnCharge(User superviseur, String nomClient, String nomSuperviseurPrenant) {
        creer(superviseur,
                "🔒 Demande prise en charge",
                "La demande de " + nomClient + " a été prise en charge par " + nomSuperviseurPrenant
                        + ". Aucune action requise.",
                "INSCRIPTION_EN_COURS");
    }

    // ── Demande traitée — notification au(x) comptable(s) ─
    public void notifierDemandeATraiter(User comptable, String nomClient) {
        creer(comptable,
                "📦 Inscription à livrer : " + nomClient,
                "Le dossier de " + nomClient
                        + " a été traité par le superviseur. Marquez-le comme livré pour finaliser.",
                "INSCRIPTION_TRAITEE");
    }

    // ── Inscription livrée — notification à l'admin ───────
    public void notifierApprouverCompte(User admin, User client, String nomParrain) {
        creerAvecRef(admin,
                "✅ Approuver le compte de " + client.getNom(),
                client.getNom() + " (parrainé par " + nomParrain + ") a été livré. "
                        + "Approuvez son compte pour lui permettre de se connecter.",
                "COMPTE_A_APPROUVER",
                (long) client.getId());
    }

    // ── Compte approuvé — notification au nouveau client ──
    public void notifierCompteApprouve(User utilisateur) {
        creer(utilisateur,
                "🎉 Votre compte a été approuvé !",
                "Bienvenue chez Cuteness Collaboration ! Votre compte est maintenant actif. "
                        + "Vous pouvez vous connecter et accéder à votre espace partenaire.",
                "COMPTE_APPROUVE");
    }

    // ── Montée de grade ───────────────────────────────────
    public void notifierGradeUp(User partenaire, GradeNiveau nouveauGrade) {
        String label = switch (nouveauGrade) {
            case BRONZE   -> "🥉 Bronze";
            case SILVER   -> "🥈 Silver";
            case GOLD     -> "🥇 Gold";
            case PLATINUM -> "💎 Platinum";
            case DIAMOND  -> "💠 Diamond";
            default       -> nouveauGrade.name();
        };
        creer(partenaire,
                "🎉 Nouveau grade : " + label + " !",
                "Félicitations ! Vous avez atteint le grade " + label
                        + ". Continuez à accumuler des points pour progresser encore plus.",
                "GRADE_UP");
    }

    // ── Challenge complété (partenaire) ──────────────────
    public void notifierChallengeComplete(User partenaire, String titreChalenge) {
        creer(partenaire,
                "🏆 Challenge complété : " + titreChalenge,
                "Félicitations ! Vous avez complété le challenge \"" + titreChalenge
                        + "\". Vos points ont été crédités sur votre solde.",
                "CHALLENGE_COMPLETE");
    }

    // ── Challenge complété (admin) ────────────────────────
    public void notifierChallengeCompleteAdmin(User admin, String nomPartenaire, String titreChalenge) {
        creer(admin,
                "🏆 Challenge terminé par " + nomPartenaire,
                "Le partenaire " + nomPartenaire + " a complété toutes les conditions du challenge \""
                        + titreChalenge + "\".",
                "CHALLENGE_COMPLETE");
    }

    // ── Récompense activée ────────────────────────────────
    public void notifierRecompenseActivee(User partenaire, String description) {
        creer(partenaire,
                "🎁 Récompense activée !",
                description,
                "RECOMPENSE");
    }

    // ── Alerte stock bas (admin) ──────────────────────────
    public void notifierStockBas(User admin, String nomProduit, int stockRestant, Long produitId) {
        creerAvecRef(admin,
                "⚠️ Stock bas : " + nomProduit,
                "Attention ! Il ne vous reste que " + stockRestant + " unité(s) du produit \""
                        + nomProduit + "\". Pensez à réapprovisionner.",
                "STOCK_BAS",
                produitId);
    }

    // ── Pack livré → action admin (mise à jour pack partenaire) ──
    public void notifierPackLivreActionAdmin(User admin, User partenaire, String nomPack) {
        creerAvecRef(admin,
                "📦 Pack livré — Mise à jour requise",
                "Le partenaire " + partenaire.getNom() + " (" + partenaire.getEmail() + ") "
                        + "a reçu le pack \"" + nomPack + "\". "
                        + "Veuillez mettre à jour son pack dans l'administration.",
                "UPGRADE_PACK",
                (long) partenaire.getId());
    }

    // ── Achat nouveau pack / upgrade (partenaire) ────────
    public void notifierUpgradePack(User partenaire, String ancienPack, String nouveauPack, double montant) {
        creer(partenaire,
                "🚀 Pack " + nouveauPack + " acheté !",
                "Félicitations ! Vous avez acheté le pack " + nouveauPack + " (" + montant + " DT débités). "
                        + "Vos produits seront livrés prochainement. "
                        + "Vos commissions et réductions sont déjà mis à jour.",
                "UPGRADE_PACK");
    }

    // ── Achat nouveau pack / upgrade (admin/superviseur) ─
    public void notifierUpgradePackAdmin(User admin, String nomPartenaire, String ancienPack, String nouveauPack) {
        creer(admin,
                "📦 Livraison pack à préparer : " + nomPartenaire,
                nomPartenaire + " a acheté le pack " + nouveauPack
                        + " (ancien pack : " + ancienPack + "). "
                        + "Veuillez préparer et livrer son nouveau pack.",
                "UPGRADE_PACK");
    }

    // ── Nouveau filleul ───────────────────────────────────
    public void notifierNouveauFilleul(User parrain, String nomFilleul) {
        creer(parrain,
                "👥 Nouveau filleul : " + nomFilleul,
                nomFilleul + " vient de rejoindre votre réseau. "
                        + "Vous percevrez des commissions sur ses achats.",
                "PARRAINAGE");
    }

    // ── API: GET mes notifications ─────────────────────────
    public List<Map<String, Object>> getMesNotifications(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        return notificationRepository
                .findByDestinataireOrderByDateCreationDesc(user)
                .stream().map(this::toMap).collect(Collectors.toList());
    }

    public long countNonLues(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        return notificationRepository.countByDestinataireAndLuFalse(user);
    }

    @Transactional
    public void marquerToutesLues(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        notificationRepository.markAllAsRead(user);
    }

    private Map<String, Object> toMap(Notification n) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", n.getId());
        m.put("titre", n.getTitre());
        m.put("message", n.getMessage());
        m.put("type", n.getType());
        m.put("lu", n.isLu());
        m.put("date", n.getDateCreation());
        m.put("referenceId", n.getReferenceId());
        return m;
    }
}
