package com.cuteness.backend.service;

import com.cuteness.backend.dto.*;
import com.cuteness.backend.entity.*;
import com.cuteness.backend.enums.TypeTransaction;
import com.cuteness.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PackAchatService {

    private final UserRepository        userRepository;
    private final PackRepository        packRepository;
    private final TransactionRepository transactionRepository;
    private final MLMCommissionService  mlmCommissionService;
    private final NotificationService   notificationService;

    @Transactional
    public AchatPackResponse acheterPack(String email, AchatPackRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        Pack pack = packRepository.findById(request.getPackId())
                .orElseThrow(() -> new RuntimeException("Pack introuvable"));

        if (user.getPack() != null && user.getPack().getId() == pack.getId())
            throw new RuntimeException("Vous possédez déjà ce pack");

        double solde = user.getSoldeInterne() == null ? 0 : user.getSoldeInterne();
        if (solde < pack.getPrix())
            throw new RuntimeException(
                "Solde insuffisant. Vous avez " + solde +
                " DT mais le pack coûte " + pack.getPrix() + " DT");

        double nouveauSolde = solde - pack.getPrix();
        user.setSoldeInterne(nouveauSolde);
        user.setPack(pack);
        user.setTauxReduction(pack.getTauxReduction());
        userRepository.save(user);

        transactionRepository.save(Transaction.builder()
                .type(TypeTransaction.ACHAT)
                .montant(pack.getPrix())
                .user(user)
                .build());

        // Notify the parrain(s) — pass full Pack so MLM service has the rates
        mlmCommissionService.calculerCommissionsSurAchatPack(user, pack);

        // Notify parrain about new filleul
        if (user.getParrain() != null) {
            notificationService.notifierNouveauFilleul(user.getParrain(), user.getNom());
        }

        return AchatPackResponse.builder()
                .message("Pack " + pack.getNom() + " acheté avec succès!")
                .nouveauPack(pack.getNom())
                .prixPaye(pack.getPrix())
                .nouveauSolde(nouveauSolde)
                .nouveauTauxCommission(pack.getTauxCommissionDirect())
                .nouveauTauxReduction(pack.getTauxReduction())
                .build();
    }
}
