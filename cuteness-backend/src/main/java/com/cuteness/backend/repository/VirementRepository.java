package com.cuteness.backend.repository;

import com.cuteness.backend.entity.User;
import com.cuteness.backend.entity.Virement;
import com.cuteness.backend.enums.StatutVirement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VirementRepository extends JpaRepository<Virement, Integer> {
    List<Virement> findByPartenaire(User partenaire);

    List<Virement> findByStatut(StatutVirement statut);

    List<Virement> findByPartenaireOrderByDateVirementDesc(User partenaire);
}
