package com.cuteness.backend.controller;

import com.cuteness.backend.dto.CategorieRequest;
import com.cuteness.backend.dto.CategorieResponse;
import com.cuteness.backend.service.CategorieService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategorieController {

    private final CategorieService categorieService;

    // GET all — every authenticated user
    @GetMapping
    public ResponseEntity<List<CategorieResponse>> getAllCategories() {
        return ResponseEntity.ok(categorieService.getAllCategories());
    }

    // GET by ID — every authenticated user
    @GetMapping("/{id}")
    public ResponseEntity<CategorieResponse> getCategorieById(@PathVariable int id) {
        return ResponseEntity.ok(categorieService.getCategorieById(id));
    }

    // POST create — ADMIN only
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategorieResponse> createCategorie(
            @Valid @RequestBody CategorieRequest request) {
        return ResponseEntity.ok(categorieService.createCategorie(request));
    }

    // PUT update — ADMIN only
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategorieResponse> updateCategorie(
            @PathVariable int id,
            @Valid @RequestBody CategorieRequest request) {
        return ResponseEntity.ok(categorieService.updateCategorie(id, request));
    }

    // DELETE — ADMIN only
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteCategorie(@PathVariable int id) {
        categorieService.deleteCategorie(id);
        return ResponseEntity.ok("Catégorie supprimée avec succès");
    }
}
