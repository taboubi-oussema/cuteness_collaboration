package com.cuteness.backend.repository;

import com.cuteness.backend.entity.Categorie;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategorieRepository extends JpaRepository<Categorie, Integer> {
    boolean existsByNom(String nom);
}
