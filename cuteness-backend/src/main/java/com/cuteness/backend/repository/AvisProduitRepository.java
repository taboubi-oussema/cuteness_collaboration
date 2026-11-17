package com.cuteness.backend.repository;

import com.cuteness.backend.entity.AvisProduit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AvisProduitRepository extends JpaRepository<AvisProduit, Integer> {
    List<AvisProduit> findByProduitIdOrderByDateCreationDesc(int produitId);
}
