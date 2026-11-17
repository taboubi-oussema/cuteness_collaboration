package com.cuteness.backend.service;

import com.cuteness.backend.dto.CategorieRequest;
import com.cuteness.backend.dto.CategorieResponse;
import com.cuteness.backend.entity.Categorie;
import com.cuteness.backend.repository.CategorieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategorieService {

    private final CategorieRepository categorieRepository;

    // ─── GET ALL ───────────────────────────────────────────
    public List<CategorieResponse> getAllCategories() {
        return categorieRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ─── GET BY ID ─────────────────────────────────────────
    public CategorieResponse getCategorieById(int id) {
        Categorie categorie = categorieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categorie introuvable"));
        return toResponse(categorie);
    }

    // ─── CREATE ────────────────────────────────────────────
    public CategorieResponse createCategorie(CategorieRequest request) {
        if (categorieRepository.existsByNom(request.getNom()))
            throw new RuntimeException("Une catégorie avec ce nom existe déjà");

        Categorie categorie = Categorie.builder()
                .nom(request.getNom())
                .description(request.getDescription())
                .couleur(request.getCouleur())
                .icone(request.getIcone())
                .build();

        return toResponse(categorieRepository.save(categorie));
    }

    // ─── UPDATE ────────────────────────────────────────────
    public CategorieResponse updateCategorie(int id, CategorieRequest request) {
        Categorie categorie = categorieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categorie introuvable"));

        if (request.getNom() != null &&
            !request.getNom().equals(categorie.getNom()) &&
            categorieRepository.existsByNom(request.getNom()))
            throw new RuntimeException("Une catégorie avec ce nom existe déjà");

        if (request.getNom() != null)
            categorie.setNom(request.getNom());
        if (request.getDescription() != null)
            categorie.setDescription(request.getDescription());
        if (request.getCouleur() != null)
            categorie.setCouleur(request.getCouleur());
        if (request.getIcone() != null)
            categorie.setIcone(request.getIcone());

        return toResponse(categorieRepository.save(categorie));
    }

    // ─── DELETE ────────────────────────────────────────────
    public void deleteCategorie(int id) {
        if (!categorieRepository.existsById(id))
            throw new RuntimeException("Categorie introuvable");
        categorieRepository.deleteById(id);
    }

    // ─── MAPPER ────────────────────────────────────────────
    private CategorieResponse toResponse(Categorie categorie) {
        return CategorieResponse.builder()
                .id(categorie.getId())
                .nom(categorie.getNom())
                .description(categorie.getDescription())
                .couleur(categorie.getCouleur())
                .icone(categorie.getIcone())
                .build();
    }
}
