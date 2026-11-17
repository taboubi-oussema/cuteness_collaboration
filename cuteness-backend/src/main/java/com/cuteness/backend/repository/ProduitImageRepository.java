package com.cuteness.backend.repository;

import com.cuteness.backend.entity.ProduitImage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProduitImageRepository extends JpaRepository<ProduitImage, Long> {
    List<ProduitImage> findAllByProduitIdOrderByOrdreAsc(int produitId);
}
