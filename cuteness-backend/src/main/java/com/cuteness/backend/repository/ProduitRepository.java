package com.cuteness.backend.repository;

import com.cuteness.backend.entity.Produit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProduitRepository extends JpaRepository<Produit, Integer> {
    boolean existsByNom(String nom);
}