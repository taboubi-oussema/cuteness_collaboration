package com.cuteness.backend.service;

import com.cuteness.backend.entity.*;
import com.cuteness.backend.enums.Role;
import com.cuteness.backend.enums.TypeTransaction;
import com.cuteness.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PackUpgradeService {

    private final UserRepository                  userRepository;
    private final PackRepository                  packRepository;
    private final PackUpgradeHistoriqueRepository historiqueRepository;
    private final TransactionRepository           transactionRepository;
    private final NotificationService             notificationService;

    @Transactional
    public Map<String, Object> upgraderPack(String email, int nouveauPackId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        Pack ancienPack = user.getPack();
        Pack nouveauPack = packRepository.findById(nouveauPackId)
                .orElseThrow(() -> new RuntimeException("Pack introuvable"));

        if (ancienPack != null && ancienPack.getId() == nouveauPackId)
            throw new RuntimeException("Vous possédez déjà ce pack");

        if (ancienPack != null && nouveauPack.getPrix() <= ancienPack.getPrix())
            throw new RuntimeException("Vous ne pouvez upgrader que vers un pack de niveau supérieur");

        // Plein prix du nouveau pack (pas la différence — le partenaire reçoit les produits du pack)
        double montantUpgrade = Math.round(nouveauPack.getPrix() * 100.0) / 100.0;

        double solde = user.getSoldeInterne() != null ? user.getSoldeInterne() : 0;
        if (solde < montantUpgrade)
            throw new RuntimeException("Solde insuffisant. Requis : " + montantUpgrade + " DT, disponible : " + solde + " DT");

        // Débit solde + mise à jour pack et taux
        user.setSoldeInterne(Math.round((solde - montantUpgrade) * 100.0) / 100.0);
        user.setPack(nouveauPack);
        user.setTauxReduction(nouveauPack.getTauxReduction());
        userRepository.save(user);

        // Historique
        PackUpgradeHistorique historique = PackUpgradeHistorique.builder()
                .user(user)
                .ancienPack(ancienPack)
                .nouveauPack(nouveauPack)
                .montantPaye(montantUpgrade)
                .build();
        historiqueRepository.save(historique);

        // Transaction
        transactionRepository.save(Transaction.builder()
                .type(TypeTransaction.UPGRADE_PACK)
                .montant(montantUpgrade)
                .sourceLabel("Achat pack " + nouveauPack.getNom())
                .user(user)
                .build());

        // Notification partenaire
        notificationService.notifierUpgradePack(user,
                ancienPack != null ? ancienPack.getNom() : "—",
                nouveauPack.getNom(), montantUpgrade);

        // Notification admins & superviseurs → livraison à préparer
        userRepository.findByRole(Role.ADMIN).forEach(admin ->
                notificationService.notifierUpgradePackAdmin(admin, user.getNom(),
                        ancienPack != null ? ancienPack.getNom() : "—", nouveauPack.getNom()));
        userRepository.findByRole(Role.SUPERVISEUR).forEach(sup ->
                notificationService.notifierUpgradePackAdmin(sup, user.getNom(),
                        ancienPack != null ? ancienPack.getNom() : "—", nouveauPack.getNom()));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Pack " + nouveauPack.getNom() + " acheté avec succès ! Votre pack sera livré prochainement.");
        result.put("nouveauPack", nouveauPack.getNom());
        result.put("montantPaye", montantUpgrade);
        result.put("nouveauSolde", user.getSoldeInterne());
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMonHistorique(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        return historiqueRepository.findByUserOrderByDateUpgradeDesc(user)
                .stream().map(this::toMap).toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllHistoriques() {
        return historiqueRepository.findAll().stream()
                .sorted(Comparator.comparing(PackUpgradeHistorique::getDateUpgrade).reversed())
                .map(this::toMap).toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPacksDisponibles(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        double prixActuel = user.getPack() != null ? user.getPack().getPrix() : 0;
        return packRepository.findAll().stream()
                .filter(p -> p.getPrix() > prixActuel)
                .sorted(Comparator.comparingDouble(Pack::getPrix))
                .map(p -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", p.getId());
                    m.put("nom", p.getNom());
                    m.put("emoji", p.getEmoji());
                    m.put("color", p.getColor());
                    m.put("prix", p.getPrix());
                    m.put("montantUpgrade", Math.round(p.getPrix() * 100.0) / 100.0);
                    m.put("tauxCommissionDirect", p.getTauxCommissionDirect());
                    m.put("tauxCommissionNiveau2", p.getTauxCommissionNiveau2());
                    m.put("tauxCommissionNiveau3", p.getTauxCommissionNiveau3());
                    m.put("tauxReduction", p.getTauxReduction());
                    m.put("taglineFr", p.getTaglineFr());
                    return m;
                }).toList();
    }

    private Map<String, Object> toMap(PackUpgradeHistorique h) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", h.getId());
        m.put("ancienPack", h.getAncienPack() != null ? h.getAncienPack().getNom() : "—");
        m.put("nouveauPack", h.getNouveauPack().getNom());
        m.put("montantPaye", h.getMontantPaye());
        m.put("date", h.getDateUpgrade());
        m.put("partenaire", h.getUser().getNom());
        m.put("email", h.getUser().getEmail());
        return m;
    }
}
