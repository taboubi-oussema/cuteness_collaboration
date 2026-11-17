package com.cuteness.backend.controller;

import com.cuteness.backend.dto.AvisProduitRequest;
import com.cuteness.backend.dto.AvisProduitResponse;
import com.cuteness.backend.service.AvisProduitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/produits")
@RequiredArgsConstructor
public class AvisProduitController {

    private final AvisProduitService avisService;

    @GetMapping("/{id}/avis")
    public ResponseEntity<List<AvisProduitResponse>> getAvis(@PathVariable int id) {
        return ResponseEntity.ok(avisService.getAvisByProduit(id));
    }

    @PostMapping("/{id}/avis")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AvisProduitResponse> addAvis(
            @PathVariable int id,
            @RequestBody AvisProduitRequest req,
            Principal principal) {
        return ResponseEntity.ok(avisService.addAvis(id, req, principal.getName()));
    }

    @DeleteMapping("/avis/{avisId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPERVISEUR')")
    public ResponseEntity<Void> deleteAvis(@PathVariable int avisId) {
        avisService.deleteAvis(avisId);
        return ResponseEntity.noContent().build();
    }
}
