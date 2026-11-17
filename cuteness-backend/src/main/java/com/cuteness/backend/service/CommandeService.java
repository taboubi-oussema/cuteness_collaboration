package com.cuteness.backend.service;

import com.cuteness.backend.dto.*;
import com.cuteness.backend.entity.*;
import com.cuteness.backend.enums.ChallengeType;
import com.cuteness.backend.enums.PointsSourceType;
import com.cuteness.backend.enums.RewardType;
import com.cuteness.backend.enums.Role;
import com.cuteness.backend.enums.StatutCommande;
import com.cuteness.backend.enums.TypeTransaction;
import com.cuteness.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommandeService {

    private final CommandeRepository commandeRepository;
    private final ProduitRepository produitRepository;
    private final PackRepository packRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final MLMCommissionService mlmCommissionService;
    private final NotificationService notificationService;
    private final NavexService navexService;
    private final PointsService pointsService;
    private final ChallengeService challengeService;
    private final PointsHistoriqueRepository pointsHistoriqueRepository;
    private final PartnerRewardRepository partnerRewardRepository;

    // ─── PLACE ORDER ───────────────────────────────────────
    @Transactional
    public CommandeResponse passerCommande(CommandeRequest request, String email) {
        User partenaire = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        double tauxReduction = partenaire.getTauxReduction() != null ?
                partenaire.getTauxReduction() : 0.0;

        // Cumul des réductions actives de type REDUCTION_POURCENT (challenges, grades)
        double rewardReduction = partnerRewardRepository
                .findActiveByPartenaireAndType(partenaire, RewardType.REDUCTION_POURCENT, LocalDate.now())
                .stream()
                .mapToDouble(PartnerReward::getValeur)
                .sum();
        tauxReduction += rewardReduction;

        String optionRemise = request.getOptionRemise() != null ? request.getOptionRemise() : "IMMEDIATE";

        Commande commande = new Commande();
        commande.setPartenaire(partenaire);
        commande.setAdresse(request.getAdresse());
        commande.setGouvernerat(request.getGouvernerat());
        commande.setVille(request.getVille());
        commande.setLocalite(request.getLocalite());
        commande.setModePaiement(request.getModePaiement());
        commande.setOptionRemise(optionRemise);
        commande.setFraisLivraison(9.0);
        // Taux stocké sur la commande ; déduction uniquement si IMMEDIATE
        commande.setTauxReduction(tauxReduction);

        double montantOriginal = 0;
        double montantProduits = 0; // réduction applicable uniquement sur les produits
        List<LigneCommande> lignes = new java.util.ArrayList<>();

        for (LigneCommandeRequest ligneReq : request.getLignes()) {
            LigneCommande ligne = new LigneCommande();
            double prixUnitaire = 0;

            if (ligneReq.getProduitId() != null) {
                Produit produit = produitRepository.findById(ligneReq.getProduitId())
                        .orElseThrow(() -> new RuntimeException("Produit introuvable"));

                if (produit.getStock() < ligneReq.getQuantite())
                    throw new RuntimeException("Stock insuffisant pour: " + produit.getNom());

                produit.setStock(produit.getStock() - ligneReq.getQuantite());
                produitRepository.save(produit);

                // ─── Alerte stock bas si stock ≤ 10 ────────────────
                if (produit.getStock() <= 10) {
                    final int stockRestant = produit.getStock();
                    final String nomProduit = produit.getNom();
                    final Long produitId = (long) produit.getId();
                    userRepository.findByRole(Role.ADMIN).forEach(admin ->
                            notificationService.notifierStockBas(admin, nomProduit, stockRestant, produitId));
                    userRepository.findByRole(Role.SUPERVISEUR).forEach(sup ->
                            notificationService.notifierStockBas(sup, nomProduit, stockRestant, produitId));
                }

                prixUnitaire = produit.getPrix();
                ligne.setProduit(produit);
                montantProduits += prixUnitaire * ligneReq.getQuantite();

            } else if (ligneReq.getPackId() != null) {
                Pack pack = packRepository.findById(ligneReq.getPackId())
                        .orElseThrow(() -> new RuntimeException("Pack introuvable"));

                // stock=0 signifie non géré (illimité) ; la contrainte ne s'applique que si stock > 0
                if (pack.getStock() > 0) {
                    if (pack.getStock() < ligneReq.getQuantite())
                        throw new RuntimeException("Stock insuffisant pour le pack: " + pack.getNom());
                    pack.setStock(pack.getStock() - ligneReq.getQuantite());
                    packRepository.save(pack);
                    if (pack.getStock() <= 10) {
                        final int stockRestant = pack.getStock();
                        final String nomPack = pack.getNom();
                        final Long packId = (long) pack.getId();
                        userRepository.findByRole(Role.ADMIN).forEach(admin ->
                                notificationService.notifierStockBas(admin, nomPack, stockRestant, packId));
                        userRepository.findByRole(Role.SUPERVISEUR).forEach(sup ->
                                notificationService.notifierStockBas(sup, nomPack, stockRestant, packId));
                    }
                }

                prixUnitaire = pack.getPrix();
                ligne.setPack(pack);
                // pas de réduction sur les packs (prix MLM fixe)

            } else {
                throw new RuntimeException("Chaque ligne doit avoir un produit ou un pack");
            }

            ligne.setQuantite(ligneReq.getQuantite());
            ligne.setPrixUnitaire(prixUnitaire);
            ligne.setCommande(commande);
            lignes.add(ligne);

            montantOriginal += prixUnitaire * ligneReq.getQuantite();
        }

        // Réduction calculée uniquement sur les produits, pas sur les packs
        double montantReduction = "IMMEDIATE".equals(optionRemise)
                ? Math.round(montantProduits * (tauxReduction / 100.0) * 100.0) / 100.0
                : 0.0;
        double montantTotal = Math.round((montantOriginal - montantReduction + 9.0) * 100.0) / 100.0;

        commande.setMontantOriginal(montantOriginal);
        commande.setMontantReduction(montantReduction);
        commande.setMontantTotal(montantTotal);
        commande.setLignes(lignes);
        commandeRepository.save(commande);

        // Notification de toutes les superviseurs
        userRepository.findByRole(Role.SUPERVISEUR).forEach(sup ->
                notificationService.notifierNouvelleCommande(
                        sup, partenaire.getNom(), commande.getId()));

        // Enregistrement de la transaction ACHAT
        Transaction transaction = Transaction.builder()
                .type(TypeTransaction.ACHAT)
                .montant(montantTotal)
                .montantOriginal(montantOriginal)
                .montantReduction(montantReduction)
                .sourceLabel("CMD-" + String.format("%03d", commande.getId()))
                .user(partenaire)
                .build();
        transactionRepository.save(transaction);

        return toResponse(commande);
    }

    // ─── CRÉER COLIS NAVEX (superviseur) ──────────────────────
    @Transactional
    public CommandeResponse creerColisNavexCommande(int id) {
        Commande commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande introuvable"));

        if (commande.getNavexRef() != null && !commande.getNavexRef().isBlank())
            throw new RuntimeException("Un colis Navex existe déjà pour cette commande");

        User p = commande.getPartenaire();
        double montant = commande.getMontantTotal() != null ? commande.getMontantTotal() : 0.0;
        String prix = String.valueOf((int) Math.round(montant));

        List<LigneCommande> lignes = commande.getLignes() != null ? commande.getLignes() : java.util.Collections.emptyList();
        String designation = lignes.stream()
                .map(l -> l.getProduit() != null ? l.getProduit().getNom()
                        : l.getPack() != null ? l.getPack().getNom() : "")
                .filter(n -> !n.isBlank())
                .collect(Collectors.joining(", "));
        if (designation.isBlank()) designation = "Commande Cuteness";

        int nbArticle = lignes.stream().mapToInt(LigneCommande::getQuantite).sum();
        if (nbArticle == 0) nbArticle = 1;

        String adresseLivraison = commande.getAdresse() != null ? commande.getAdresse() : "";
        String gouvernerat = commande.getGouvernerat() != null ? commande.getGouvernerat()
                : (p != null && p.getRegion() != null ? p.getRegion() : "Tunis");
        String ville = commande.getVille() != null ? commande.getVille() : gouvernerat;

        String ref = navexService.creerColis(
                p != null ? p.getNom() : "",
                gouvernerat,
                ville,
                p != null ? p.getTelephone() : "",
                designation,
                prix,
                adresseLivraison,
                String.valueOf(nbArticle));

        if (ref == null)
            throw new RuntimeException("Erreur lors de la création du colis chez Navex");

        commande.setNavexRef(ref);
        commande.setStatut(StatutCommande.EN_PREPARATION);
        commandeRepository.save(commande);
        return toResponse(commande);
    }

    // ─── TRAITER (superviseur) — attache navexRef ──────────
    @Transactional
    public CommandeResponse traiterCommande(int id, String navexRef, String handlerEmail) {
        Commande commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande introuvable"));
        commande.setNavexRef(navexRef);
        return updateStatut(id, StatutCommande.EN_PREPARATION, handlerEmail);
    }

    // ─── GET À CONFIRMER (comptable) ───────────────────────
    @Transactional(readOnly = true)
    public List<CommandeResponse> getCommandesAConfirmer() {
        return commandeRepository.findByConfirmationComptableRequiseTrue()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ─── CONFIRMER (comptable) ─────────────────────────────
    @Transactional
    public CommandeResponse confirmer(int id) {
        Commande commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande introuvable"));
        String type = commande.getTypeConfirmation();
        commande.setConfirmationComptableRequise(false);
        commandeRepository.save(commande);
        return updateStatut(id, "RETOUR".equals(type)
                ? StatutCommande.RETOURNEE : StatutCommande.LIVREE);
    }

    // ─── UPDATE STATUS ─────────────────────────────────────
    @Transactional
    public CommandeResponse updateStatut(int id, StatutCommande statut) {
        return updateStatut(id, statut, null);
    }

    @Transactional
    public CommandeResponse updateStatut(int id, StatutCommande statut, String handlerEmail) {
        Commande commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande introuvable"));

        StatutCommande ancienStatut = commande.getStatut();
        commande.setStatut(statut);

        // Passe à EN_PREPARATION : enregistre le superviseur traitant
        if (statut == StatutCommande.EN_PREPARATION && ancienStatut != StatutCommande.EN_PREPARATION
                && handlerEmail != null) {
            userRepository.findByEmail(handlerEmail).ifPresent(commande::setSuperviseur);
        }

        commandeRepository.save(commande);

        // ─── EN_PREPARATION → notify partenaire ───────────────
        if (statut == StatutCommande.EN_PREPARATION && ancienStatut != StatutCommande.EN_PREPARATION) {
            String ref = "CMD-" + String.format("%03d", commande.getId());
            notificationService.notifierEnPreparation(commande.getPartenaire(), ref);
        }

        // Livraison confirmée : points, progression challenges, commissions MLM
        if (statut == StatutCommande.LIVREE && ancienStatut != StatutCommande.LIVREE) {
            String ref = "CMD-" + String.format("%03d", commande.getId());
            notificationService.notifierLivraisonSansCredit(commande.getPartenaire(), ref);

            // Si la commande contient un pack, notifier les admins pour mise à jour
            commande.getLignes().stream()
                    .filter(l -> l.getPack() != null)
                    .forEach(l -> userRepository.findByRole(Role.ADMIN).forEach(admin ->
                            notificationService.notifierPackLivreActionAdmin(
                                    admin, commande.getPartenaire(), l.getPack().getNom())));

            User partenaire = commande.getPartenaire();
            try {
                challengeService.processerEvent(partenaire, ChallengeType.COMMANDE,
                        PointsSourceType.COMMANDE_LIVREE, (long) commande.getId());
            } catch (Exception e) {
                log.warn("Challenge/points event failed for partenaire {} commande {}: {}",
                        partenaire.getId(), commande.getId(), e.getMessage());
            }
            try {
                mlmCommissionService.calculerEtDistribuerCommissions(commande);
            } catch (Exception e) {
                log.warn("MLM commissions failed for commande {}: {}", commande.getId(), e.getMessage());
            }
        }

        // ─── ANNULEE → restore stock ───────────────────────
        if (statut == StatutCommande.ANNULEE && ancienStatut != StatutCommande.ANNULEE) {
            for (LigneCommande ligne : commande.getLignes()) {
                if (ligne.getProduit() != null) {
                    Produit produit = ligne.getProduit();
                    produit.setStock(produit.getStock() + ligne.getQuantite());
                    produitRepository.save(produit);
                } else if (ligne.getPack() != null) {
                    Pack pack = ligne.getPack();
                    pack.setStock(pack.getStock() + ligne.getQuantite());
                    packRepository.save(pack);
                }
            }
        }

        // Retour : restauration des stocks + débit de 5 DT sur le solde du partenaire
        if (statut == StatutCommande.RETOURNEE && ancienStatut != StatutCommande.RETOURNEE) {
            for (LigneCommande ligne : commande.getLignes()) {
                if (ligne.getProduit() != null) {
                    Produit produit = ligne.getProduit();
                    produit.setStock(produit.getStock() + ligne.getQuantite());
                    produitRepository.save(produit);
                } else if (ligne.getPack() != null) {
                    Pack pack = ligne.getPack();
                    pack.setStock(pack.getStock() + ligne.getQuantite());
                    packRepository.save(pack);
                }
            }
            User partenaire = commande.getPartenaire();
            double solde = partenaire.getSoldeInterne() == null ? 0 : partenaire.getSoldeInterne();
            partenaire.setSoldeInterne(Math.round((solde - 5.0) * 100.0) / 100.0);
            userRepository.save(partenaire);

            Transaction debitTx = Transaction.builder()
                    .type(TypeTransaction.DEBIT)
                    .montant(5.0)
                    .user(partenaire)
                    .build();
            transactionRepository.save(debitTx);

            String ref = "CMD-" + String.format("%03d", commande.getId());
            notificationService.notifierRetour(partenaire, ref);
        }

        return toResponse(commande);
    }

    // ─── MARQUER LIVRÉ + remboursement auto si REMBOURSEMENT ─────
    @Transactional
    public CommandeResponse marquerLivre(int id) {
        updateStatut(id, StatutCommande.LIVREE);
        Commande commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande introuvable"));
        if ("REMBOURSEMENT".equals(commande.getOptionRemise())
                && !Boolean.TRUE.equals(commande.getRemboursementApprouve())) {
            approuverRemboursement(id);
            // Auto-crédit de la commission associée à cette commande (livré + remboursé simultanément)
            String ref = "CMD-" + String.format("%03d", id);
            transactionRepository.findAll().stream()
                    .filter(t -> t.getType() == TypeTransaction.COMMISSION
                            && "EN_ATTENTE".equals(t.getStatut())
                            && t.getSourceLabel() != null && t.getSourceLabel().startsWith(ref + " —"))
                    .forEach(t -> {
                        User u = t.getUser();
                        double solde = u.getSoldeInterne() == null ? 0 : u.getSoldeInterne();
                        u.setSoldeInterne(Math.round((solde + t.getMontant()) * 100.0) / 100.0);
                        userRepository.save(u);
                        t.setStatut("VALIDEE");
                        transactionRepository.save(t);
                    });
            return toResponse(commandeRepository.findById(id).orElseThrow());
        }
        return toResponse(commande);
    }

    // ─── MARQUER RETOUR + débit 5 DT ──────────────────────
    @Transactional
    public CommandeResponse marquerRetour(int id) {
        return updateStatut(id, StatutCommande.RETOURNEE);
    }

    // ─── APPROVE REMBOURSEMENT ─────────────────────────────
    @Transactional
    public CommandeResponse approuverRemboursement(int id) {
        Commande commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande introuvable"));

        if (Boolean.TRUE.equals(commande.getRemboursementApprouve()))
            throw new RuntimeException("Remboursement déjà approuvé");

        if (commande.getStatut() != StatutCommande.LIVREE)
            throw new RuntimeException("La commande doit être livrée pour approuver le remboursement");

        User partenaire = commande.getPartenaire();
        double taux = commande.getTauxReduction();
        // Réduction calculée uniquement sur les produits, pas sur les packs
        double montantProduits = commande.getLignes().stream()
                .filter(l -> l.getProduit() != null)
                .mapToDouble(l -> l.getPrixUnitaire() * l.getQuantite())
                .sum();
        double credit = Math.round(montantProduits * (taux / 100.0) * 100.0) / 100.0;

        double solde = partenaire.getSoldeInterne() == null ? 0 : partenaire.getSoldeInterne();
        partenaire.setSoldeInterne(Math.round((solde + credit) * 100.0) / 100.0);
        userRepository.save(partenaire);

        String ref = "CMD-" + String.format("%03d", commande.getId());
        Transaction creditTx = Transaction.builder()
                .user(partenaire)
                .type(TypeTransaction.CREDIT)
                .montant(credit)
                .sourceLabel("Remboursement réduction — " + ref)
                .build();
        transactionRepository.save(creditTx);

        commande.setRemboursementApprouve(true);
        commandeRepository.save(commande);

        notificationService.notifierLivraison(partenaire, ref, credit, (int) taux);

        return toResponse(commande);
    }

    // ─── SUPPRIMER COMMANDE ────────────────────────────────
    @Transactional
    public void supprimerCommande(int id) {
        Commande commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande introuvable"));
        // Restore stock
        for (LigneCommande ligne : commande.getLignes()) {
            if (ligne.getProduit() != null) {
                Produit produit = ligne.getProduit();
                produit.setStock(produit.getStock() + ligne.getQuantite());
                produitRepository.save(produit);
            } else if (ligne.getPack() != null) {
                Pack pack = ligne.getPack();
                pack.setStock(pack.getStock() + ligne.getQuantite());
                packRepository.save(pack);
            }
        }
        // Remove linked ACHAT transaction
        String ref = "CMD-" + String.format("%03d", commande.getId());
        transactionRepository.findAll().stream()
                .filter(t -> t.getType() == TypeTransaction.ACHAT
                        && ref.equals(t.getSourceLabel()))
                .forEach(transactionRepository::delete);
        commandeRepository.delete(commande);
    }
    // ─── GET MY ORDERS ─────────────────────────────────────
    @Transactional(readOnly = true)
    public List<CommandeResponse> getMesCommandes(String email) {
        User partenaire = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        return commandeRepository.findByPartenaireOrderByDateCommandeDesc(partenaire)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ─── GET ALL ───────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<CommandeResponse> getAllCommandes() {
        return commandeRepository.findAllByOrderByDateCommandeDesc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ─── ADMIN: RETRIGGER POINTS (fix existing LIVREE orders) ─────────────────
    @Transactional
    public Map<String, Object> retriggerGamificationPoints(int commandeId) {
        Commande commande = commandeRepository.findById(commandeId)
                .orElseThrow(() -> new RuntimeException("Commande introuvable"));

        if (commande.getStatut() != StatutCommande.LIVREE)
            throw new RuntimeException("La commande doit être en statut LIVREE");

        User partenaire = commande.getPartenaire();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("commandeId", commandeId);
        result.put("partenaireEmail", partenaire.getEmail());

        boolean alreadyAwarded = pointsHistoriqueRepository
                .existsByPartenaireAndSourceTypeAndSourceId(
                        partenaire, PointsSourceType.COMMANDE_LIVREE, (long) commandeId);

        if (!alreadyAwarded) {
            try {
                challengeService.processerEvent(partenaire, ChallengeType.COMMANDE,
                        PointsSourceType.COMMANDE_LIVREE, (long) commandeId);
                result.put("pointsAttribues", true);
                result.put("challengeTriggered", true);
            } catch (Exception e) {
                result.put("pointsAttribues", false);
                result.put("challengeTriggered", false);
                result.put("challengeError", e.getMessage());
                log.warn("Challenge/points re-trigger failed for commande {}: {}", commandeId, e.getMessage());
            }
        } else {
            result.put("pointsAttribues", false);
            result.put("note", "Points déjà attribués pour cette commande");
            try {
                challengeService.onEventParPartenaire(partenaire, ChallengeType.COMMANDE, 1);
                result.put("challengeTriggered", true);
            } catch (Exception e) {
                result.put("challengeTriggered", false);
                result.put("challengeError", e.getMessage());
                log.warn("Challenge re-trigger failed for commande {}: {}", commandeId, e.getMessage());
            }
        }

        return result;
    }

    // ─── MAPPER ────────────────────────────────────────────
    private CommandeResponse toResponse(Commande commande) {
        List<LigneCommande> lignes = commande.getLignes();
        if (lignes == null) lignes = java.util.Collections.emptyList();
        List<LigneCommandeResponse> lignesResponse = lignes.stream()
                .map(l -> LigneCommandeResponse.builder()
                        .id(l.getId())
                        .nomProduit(l.getProduit() != null ? l.getProduit().getNom()
                                : l.getPack() != null ? l.getPack().getNom() : "—")
                        .quantite(l.getQuantite())
                        .prixUnitaire(l.getPrixUnitaire())
                        .sousTotal(l.getPrixUnitaire() * l.getQuantite())
                        .build())
                .collect(Collectors.toList());

        User p = commande.getPartenaire();
        User sup = commande.getSuperviseur();
        return CommandeResponse.builder()
                .id(commande.getId())
                .dateCommande(commande.getDateCommande())
                .statut(commande.getStatut())
                .montantOriginal(commande.getMontantOriginal() != null ? commande.getMontantOriginal() : 0.0)
                .tauxReduction(commande.getTauxReduction() != null ? commande.getTauxReduction() : 0.0)
                .montantReduction(commande.getMontantReduction() != null ? commande.getMontantReduction() : 0.0)
                .montantTotal(commande.getMontantTotal() != null ? commande.getMontantTotal() : 0.0)
                .fraisLivraison(commande.getFraisLivraison() != null ? commande.getFraisLivraison() : 9.0)
                .adresse(commande.getAdresse())
                .gouvernerat(commande.getGouvernerat())
                .ville(commande.getVille())
                .localite(commande.getLocalite())
                .modePaiement(commande.getModePaiement())
                .optionRemise(commande.getOptionRemise())
                .remboursementApprouve(Boolean.TRUE.equals(commande.getRemboursementApprouve()))
                .nomPartenaire(p != null ? p.getNom() : "—")
                .emailPartenaire(p != null ? p.getEmail() : "")
                .telephonePartenaire(p != null ? p.getTelephone() : "")
                .regionPartenaire(p != null ? p.getRegion() : "")
                .nomPack(p != null && p.getPack() != null ? p.getPack().getNom() : null)
                .navexRef(commande.getNavexRef())
                .navexStatut(commande.getNavexStatut())
                .confirmationComptableRequise(Boolean.TRUE.equals(commande.getConfirmationComptableRequise()))
                .typeConfirmation(commande.getTypeConfirmation())
                .nomSuperviseur(sup != null ? sup.getNom() : null)
                .emailSuperviseur(sup != null ? sup.getEmail() : null)
                .lignes(lignesResponse)
                .build();
    }
}
