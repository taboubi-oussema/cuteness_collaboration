package com.cuteness.backend.controller;

import com.cuteness.backend.dto.*;
import com.cuteness.backend.service.ProduitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/produits")
@RequiredArgsConstructor
public class ProduitController {

    private final ProduitService produitService;

    // GET all — everyone authenticated
    @GetMapping
    public ResponseEntity<List<ProduitResponse>> getAllProduits() {
        return ResponseEntity.ok(produitService.getAllProduits());
    }

    // GET by ID — everyone authenticated
    @GetMapping("/{id}")
    public ResponseEntity<ProduitResponse> getProduitById(@PathVariable int id) {
        return ResponseEntity.ok(produitService.getProduitById(id));
    }

    // POST create — ADMIN + SUPERVISEUR only
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISEUR')")
    public ResponseEntity<ProduitResponse> createProduit(@Valid @RequestBody ProduitRequest request) {
        return ResponseEntity.ok(produitService.createProduit(request));
    }

    // PUT update — ADMIN + SUPERVISEUR only
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISEUR')")
    public ResponseEntity<ProduitResponse> updateProduit(@PathVariable int id,
                                                          @Valid @RequestBody ProduitRequest request) {
        return ResponseEntity.ok(produitService.updateProduit(id, request));
    }

    // DELETE — ADMIN + SUPERVISEUR only
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISEUR')")
    public ResponseEntity<String> deleteProduit(@PathVariable int id) {
        produitService.deleteProduit(id);
        return ResponseEntity.ok("Produit supprimé avec succès");
    }

    // ── Images ──
    @PostMapping("/{id}/images")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISEUR')")
    public ResponseEntity<List<String>> addImage(@PathVariable int id,
                                                  @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(produitService.addImage(id, body.get("imageUrl")));
    }

    @PostMapping("/{id}/images/delete-by-url")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISEUR')")
    public ResponseEntity<List<String>> deleteImageByUrl(@PathVariable int id,
                                                          @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(produitService.deleteImageByUrl(id, body.get("imageUrl")));
    }
}