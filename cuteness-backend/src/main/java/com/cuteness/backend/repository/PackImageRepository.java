package com.cuteness.backend.repository;

import com.cuteness.backend.entity.PackImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PackImageRepository extends JpaRepository<PackImage, Long> {
    List<PackImage> findAllByPackIdOrderByOrdreAsc(int packId);
    void deleteByPackId(int packId);
}
