package com.cuteness.backend.repository;

import com.cuteness.backend.entity.DemandeInscription;
import com.cuteness.backend.entity.User;
import com.cuteness.backend.enums.StatutDemande;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DemandeInscriptionRepository extends JpaRepository<DemandeInscription, Long> {
    List<DemandeInscription> findByStatut(StatutDemande statut);
    List<DemandeInscription> findByStatutIn(List<StatutDemande> statuts);
    List<DemandeInscription> findBySuperviseur(User superviseur);
    Optional<DemandeInscription> findByUtilisateur(User utilisateur);
}
