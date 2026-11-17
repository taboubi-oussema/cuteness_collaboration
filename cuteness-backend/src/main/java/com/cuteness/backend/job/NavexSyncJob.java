package com.cuteness.backend.job;

import com.cuteness.backend.entity.Commande;
import com.cuteness.backend.enums.StatutCommande;
import com.cuteness.backend.repository.CommandeRepository;
import com.cuteness.backend.service.NavexService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class NavexSyncJob {

    private final CommandeRepository commandeRepository;
    private final NavexService navexService;

    // Runs every 30 minutes
    @Scheduled(fixedDelay = 1_800_000)
    @Transactional
    public void syncNavexStatuts() {
        List<Commande> commandes = commandeRepository
                .findByStatutAndNavexRefIsNotNull(StatutCommande.EN_PREPARATION);

        if (commandes.isEmpty()) return;
        log.info("Navex sync: {} commandes EN_PREPARATION à vérifier", commandes.size());

        for (Commande c : commandes) {
            try {
                String etat = navexService.getEtat(c.getNavexRef());
                if (etat == null) continue;

                c.setNavexStatut(etat);

                if (navexService.isLivre(etat) && !Boolean.TRUE.equals(c.getConfirmationComptableRequise())) {
                    c.setConfirmationComptableRequise(true);
                    c.setTypeConfirmation("LIVRAISON");
                    log.info("Commande #{} livrée par Navex — en attente confirmation comptable", c.getId());

                } else if (navexService.isRetour(etat) && !Boolean.TRUE.equals(c.getConfirmationComptableRequise())) {
                    c.setConfirmationComptableRequise(true);
                    c.setTypeConfirmation("RETOUR");
                    log.info("Commande #{} retournée par Navex — en attente confirmation comptable", c.getId());
                }

                commandeRepository.save(c);

            } catch (Exception e) {
                log.error("Navex sync erreur commande #{}: {}", c.getId(), e.getMessage());
            }
        }
    }
}
