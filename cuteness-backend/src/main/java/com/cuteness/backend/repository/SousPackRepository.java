package com.cuteness.backend.repository;

import com.cuteness.backend.entity.SousPack;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SousPackRepository extends JpaRepository<SousPack, Long> {
    List<SousPack> findAllByPackIdOrderByOrdreAsc(int packId);
}
