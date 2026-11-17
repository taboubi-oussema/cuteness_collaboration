package com.cuteness.backend.repository;

import com.cuteness.backend.entity.Formation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FormationRepository extends JpaRepository<Formation, Integer> {
    List<Formation> findAllByOrderByOrdreAsc();
}
