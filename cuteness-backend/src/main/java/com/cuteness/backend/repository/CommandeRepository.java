package com.cuteness.backend.repository;

import com.cuteness.backend.entity.Commande;
import com.cuteness.backend.entity.User;
import com.cuteness.backend.enums.StatutCommande;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommandeRepository extends JpaRepository<Commande, Integer> {
    List<Commande> findByPartenaireOrderByDateCommandeDesc(User partenaire);
    List<Commande> findByPartenaire(User partenaire);
    List<Commande> findByStatutAndNavexRefIsNotNull(StatutCommande statut);
    List<Commande> findByConfirmationComptableRequiseTrue();
    List<Commande> findAllByOrderByDateCommandeDesc();
}
