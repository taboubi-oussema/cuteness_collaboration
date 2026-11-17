package com.cuteness.backend.service;

import com.cuteness.backend.entity.*;
import com.cuteness.backend.enums.ChallengeType;
import com.cuteness.backend.enums.TypeTransaction;
import com.cuteness.backend.repository.TransactionRepository;
import com.cuteness.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class MLMCommissionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository        userRepository;
    private final NotificationService   notificationService;
    private final ChallengeService      challengeService;

    // ── Triggered when order is LIVREE ─────────────────────
    // Only the ordering partner earns their direct commission — EN_ATTENTE, to be credited manually
    // (or auto-credited when REMBOURSEMENT option is fully processed).
    @Transactional
    public void calculerEtDistribuerCommissions(Commande commande) {
        String ref = "CMD-" + String.format("%03d", commande.getId());
        double base = commande.getMontantOriginal() != null ? commande.getMontantOriginal() : 0.0;
        User partenaire = commande.getPartenaire();
        if (partenaire == null || partenaire.getPack() == null) return;
        crediter(partenaire, base,
                partenaire.getPack().getTauxCommissionDirect() / 100.0,
                1, ref, "Vente boutique");
    }

    // ── Triggered when pack is purchased ───────────────────
    @Transactional
    public void calculerCommissionsSurAchatPack(User acheteur, Pack pack) {
        distribuer(acheteur, pack.getPrix(), "Pack " + pack.getNom());
    }

    // ── Core distribution (3 levels) ───────────────────────
    private void distribuer(User acheteur, double montantBase, String sourceRef) {
        User n1 = acheteur.getParrain();
        if (n1 != null && n1.getPack() != null) {
            crediter(n1, montantBase, n1.getPack().getTauxCommissionDirect() / 100.0,
                    1, sourceRef, acheteur.getNom());

            User n2 = n1.getParrain();
            if (n2 != null && n2.getPack() != null) {
                crediter(n2, montantBase, n2.getPack().getTauxCommissionNiveau2() / 100.0,
                        2, sourceRef, acheteur.getNom());

                User n3 = n2.getParrain();
                if (n3 != null && n3.getPack() != null) {
                    crediter(n3, montantBase, n3.getPack().getTauxCommissionNiveau3() / 100.0,
                            3, sourceRef, acheteur.getNom());
                }
            }
        }
    }

    // Auto-credits balance immediately — used for boutique order commissions.
    private void crediterDirectement(User partenaire, double base, double taux,
            int niveau, String sourceRef, String nomSource) {
        double montant = Math.round(base * taux * 100.0) / 100.0;
        if (montant <= 0) return;

        String sourceLabel = sourceRef + " — " + nomSource;

        double solde = partenaire.getSoldeInterne() != null ? partenaire.getSoldeInterne() : 0.0;
        partenaire.setSoldeInterne(solde + montant);
        userRepository.save(partenaire);

        transactionRepository.save(Transaction.builder()
                .type(TypeTransaction.COMMISSION)
                .montant(montant)
                .user(partenaire)
                .statut("VALIDEE")
                .niveau(niveau)
                .sourceLabel(sourceLabel)
                .sourceUserNom(nomSource)
                .build());

        notificationService.notifierCommissionPayee(partenaire, montant);
        challengeService.onEventParPartenaire(partenaire, ChallengeType.COMMISSION, 1);

        log.info("Commission N{} auto-créditée → {} : +{} DT (source: {})", niveau, partenaire.getNom(), montant, sourceLabel);
    }

    private void crediter(User parrain, double base, double taux,
            int niveau, String sourceRef, String nomAcheteur) {

        double montant = Math.round(base * taux * 100.0) / 100.0;
        if (montant <= 0) return;

        String sourceLabel = sourceRef + " — " + nomAcheteur;

        transactionRepository.save(Transaction.builder()
                .type(TypeTransaction.COMMISSION)
                .montant(montant)
                .user(parrain)
                .statut("EN_ATTENTE")
                .niveau(niveau)
                .sourceLabel(sourceLabel)
                .sourceUserNom(nomAcheteur)
                .build());

        notificationService.notifierCommissionAttente(parrain, montant, niveau, sourceLabel);
        challengeService.onEventParPartenaire(parrain, ChallengeType.COMMISSION, 1);

        log.info("Commission N{} → {} : +{} DT (source: {})", niveau, parrain.getNom(), montant, sourceLabel);
    }
}
