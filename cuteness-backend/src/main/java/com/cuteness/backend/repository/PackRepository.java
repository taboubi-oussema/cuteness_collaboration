package com.cuteness.backend.repository;

import com.cuteness.backend.entity.Pack;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PackRepository extends JpaRepository<Pack, Integer> {
    boolean existsByNom(String nom);
}