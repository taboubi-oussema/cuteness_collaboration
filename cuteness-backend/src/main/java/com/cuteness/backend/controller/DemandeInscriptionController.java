package com.cuteness.backend.controller;

import com.cuteness.backend.service.DemandeInscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inscriptions")
@RequiredArgsConstructor
public class DemandeInscriptionController {

    private final DemandeInscriptionService demandeService;

    /** Toutes les demandes — admin / comptable */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'COMPTABLE', 'SUPERVISEUR')")
    public ResponseEntity<List<Map<String, Object>>> getAll() {
        return ResponseEntity.ok(demandeService.getDemandes());
    }

    /** Vue superviseur : NOUVELLE + EN_COURS + ses propres TRAITEE */
    @GetMapping("/mes-demandes")
    @PreAuthorize("hasRole('SUPERVISEUR')")
    public ResponseEntity<List<Map<String, Object>>> getMesDemandes(Authentication auth) {
        return ResponseEntity.ok(demandeService.getDemandesForSuperviseur(auth.getName()));
    }

    /** TRAITEE uniquement — pour que le comptable marque LIVREE */
    @GetMapping("/traitees")
    @PreAuthorize("hasAnyRole('COMPTABLE', 'ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getTraitees() {
        return ResponseEntity.ok(demandeService.getDemandesTraitees());
    }

    /** Le superviseur prend en charge une demande NOUVELLE */
    @PostMapping("/{id}/prendre-en-charge")
    @PreAuthorize("hasRole('SUPERVISEUR')")
    public ResponseEntity<Map<String, Object>> prendreEnCharge(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(demandeService.prendreEnCharge(id, auth.getName()));
    }

    /** Le superviseur marque la demande comme traitée */
    @PostMapping("/{id}/marquer-traitee")
    @PreAuthorize("hasRole('SUPERVISEUR')")
    public ResponseEntity<Map<String, Object>> marquerTraitee(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(demandeService.marquerTraitee(id, auth.getName()));
    }

    /** Le comptable marque la demande comme livrée → déclenche commission + notification d'approbation de compte */
    @PostMapping("/{id}/marquer-livree")
    @PreAuthorize("hasAnyRole('COMPTABLE', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> marquerLivree(@PathVariable Long id) {
        return ResponseEntity.ok(demandeService.marquerLivree(id));
    }

    /** Le superviseur/comptable crée un colis Navex et enregistre la référence de suivi */
    @PostMapping("/{id}/colis-navex")
    @PreAuthorize("hasAnyRole('SUPERVISEUR', 'COMPTABLE', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> creerColisNavex(@PathVariable Long id) {
        return ResponseEntity.ok(demandeService.creerColisNavex(id));
    }
}
