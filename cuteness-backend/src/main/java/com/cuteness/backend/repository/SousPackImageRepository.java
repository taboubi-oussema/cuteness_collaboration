package com.cuteness.backend.repository;

import com.cuteness.backend.entity.SousPackImage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SousPackImageRepository extends JpaRepository<SousPackImage, Long> {
    List<SousPackImage> findAllBySousPackIdOrderByOrdreAsc(Long sousPackId);
}
