package com.cuteness.backend.service;

import com.cuteness.backend.dto.*;
import com.cuteness.backend.entity.Categorie;
import com.cuteness.backend.entity.Produit;
import com.cuteness.backend.entity.ProduitImage;
import com.cuteness.backend.repository.CategorieRepository;
import com.cuteness.backend.repository.ProduitImageRepository;
import com.cuteness.backend.repository.ProduitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProduitService {

    private final ProduitRepository      produitRepository;
    private final CategorieRepository    categorieRepository;
    private final ProduitImageRepository produitImageRepository;

    // ─── GET ALL ───────────────────────────────────────────
    public List<ProduitResponse> getAllProduits() {
        return produitRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ─── GET BY ID ─────────────────────────────────────────
    public ProduitResponse getProduitById(int id) {
        Produit produit = produitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produit introuvable"));
        return toResponse(produit);
    }

    // ─── CREATE ────────────────────────────────────────────
    public ProduitResponse createProduit(ProduitRequest request) {
        if (produitRepository.existsByNom(request.getNom()))
            throw new RuntimeException("Un produit avec ce nom existe déjà");

        if (request.getPrix() <= 0)
            throw new RuntimeException("Le prix doit être supérieur à 0");

        if (request.getStock() < 0)
            throw new RuntimeException("Le stock ne peut pas être négatif");

        Categorie categorie = resolveCategorie(request.getCategorieId());

        Produit produit = Produit.builder()
                .nom(request.getNom())
                .description(request.getDescription())
                .prix(request.getPrix())
                .stock(request.getStock())
                .categorie(categorie)
                .imageUrl(request.getImageUrl())
                .bestSeller(request.isBestSeller())
                .enPromo(request.isEnPromo())
                .prixPromo(request.getPrixPromo())
                .cible(request.getCible())
                .build();

        return toResponse(produitRepository.save(produit));
    }

    // ─── UPDATE ────────────────────────────────────────────
    public ProduitResponse updateProduit(int id, ProduitRequest request) {
        Produit produit = produitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produit introuvable"));

        if (request.getNom() != null &&
            !request.getNom().equals(produit.getNom()) &&
            produitRepository.existsByNom(request.getNom()))
            throw new RuntimeException("Un produit avec ce nom existe déjà");

        if (request.getNom() != null)
            produit.setNom(request.getNom());
        if (request.getDescription() != null)
            produit.setDescription(request.getDescription());
        if (request.getPrix() > 0)
            produit.setPrix(request.getPrix());
        if (request.getStock() >= 0)
            produit.setStock(request.getStock());
        if (request.getCategorieId() != null)
            produit.setCategorie(resolveCategorie(request.getCategorieId()));
        if (request.getImageUrl() != null)
            produit.setImageUrl(request.getImageUrl());
        produit.setBestSeller(request.isBestSeller());
        produit.setEnPromo(request.isEnPromo());
        produit.setPrixPromo(request.getPrixPromo());
        produit.setCible(request.getCible());

        return toResponse(produitRepository.save(produit));
    }

    // ─── DELETE ────────────────────────────────────────────
    public void deleteProduit(int id) {
        if (!produitRepository.existsById(id))
            throw new RuntimeException("Produit introuvable");
        produitRepository.deleteById(id);
    }

    // ─── IMAGES ────────────────────────────────────────────
    public List<String> addImage(int produitId, String imageUrl) {
        Produit produit = produitRepository.findById(produitId)
                .orElseThrow(() -> new RuntimeException("Produit introuvable"));
        int ordre = produitImageRepository.findAllByProduitIdOrderByOrdreAsc(produitId).size();
        produitImageRepository.save(ProduitImage.builder()
                .produit(produit).imageUrl(imageUrl).ordre(ordre).build());
        return produitImageRepository.findAllByProduitIdOrderByOrdreAsc(produitId)
                .stream().map(ProduitImage::getImageUrl).collect(Collectors.toList());
    }

    @Transactional
    public List<String> deleteImageByUrl(int produitId, String imageUrl) {
        produitImageRepository.findAllByProduitIdOrderByOrdreAsc(produitId).stream()
                .filter(i -> i.getImageUrl().equals(imageUrl)).findFirst()
                .ifPresent(produitImageRepository::delete);
        return produitImageRepository.findAllByProduitIdOrderByOrdreAsc(produitId)
                .stream().map(ProduitImage::getImageUrl).collect(Collectors.toList());
    }

    // ─── MAPPER ────────────────────────────────────────────
    private ProduitResponse toResponse(Produit produit) {
        CategorieResponse categorieResponse = null;
        if (produit.getCategorie() != null) {
            Categorie c = produit.getCategorie();
            categorieResponse = CategorieResponse.builder()
                    .id(c.getId())
                    .nom(c.getNom())
                    .description(c.getDescription())
                    .couleur(c.getCouleur())
                    .icone(c.getIcone())
                    .build();
        }
        List<String> imgList = produit.getImages() == null ? Collections.emptyList() :
                produit.getImages().stream().map(ProduitImage::getImageUrl).collect(Collectors.toList());
        return ProduitResponse.builder()
                .id(produit.getId())
                .nom(produit.getNom())
                .description(produit.getDescription())
                .prix(produit.getPrix())
                .stock(produit.getStock())
                .categorie(categorieResponse)
                .imageUrl(produit.getImageUrl())
                .bestSeller(produit.isBestSeller())
                .enPromo(produit.isEnPromo())
                .prixPromo(produit.getPrixPromo())
                .cible(produit.getCible())
                .images(imgList)
                .build();
    }

    // ─── HELPERS ───────────────────────────────────────────
    /**
     * Returns the Categorie for the given id, null when id is null.
     * Throws if the id is provided but does not match any row.
     */
    private Categorie resolveCategorie(Integer categorieId) {
        if (categorieId == null) return null;
        return categorieRepository.findById(categorieId)
                .orElseThrow(() -> new RuntimeException("Categorie introuvable"));
    }
}