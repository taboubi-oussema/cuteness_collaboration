package com.cuteness.backend.controller;

import com.cuteness.backend.service.SignalementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/signalements")
@RequiredArgsConstructor
public class SignalementController {

    private final SignalementService signalementService;

    // GET all — superviseur/admin/comptable
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISEUR', 'COMPTABLE')")
    public ResponseEntity<List<Map<String, Object>>> getAll() {
        return ResponseEntity.ok(signalementService.getAll());
    }

    // GET my signalements — partenaire
    @GetMapping("/mes-signalements")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> getMes(Authentication auth) {
        return ResponseEntity.ok(signalementService.getMesSignalements(auth.getName()));
    }

    // POST — partenaire creates a signalement (multipart/form-data)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> create(
            Authentication auth,
            @RequestParam("type") String type,
            @RequestParam("description") String description,
            @RequestParam(value = "priorite", defaultValue = "MOYENNE") String priorite,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        return ResponseEntity.ok(
                signalementService.create(auth.getName(), type, description, priorite, file));
    }

    // PATCH — prendre en charge
    @PatchMapping("/{id}/prendre-en-charge")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISEUR')")
    public ResponseEntity<Map<String, Object>> prendreEnCharge(@PathVariable Long id) {
        return ResponseEntity.ok(signalementService.prendreEnCharge(id));
    }

    // PATCH — résoudre
    @PatchMapping("/{id}/resoudre")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISEUR')")
    public ResponseEntity<Map<String, Object>> resoudre(@PathVariable Long id) {
        return ResponseEntity.ok(signalementService.resoudre(id));
    }

    // PATCH — répondre (admin)
    @PatchMapping("/{id}/repondre")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> repondre(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reponse = body != null ? body.get("reponse") : null;
        return ResponseEntity.ok(signalementService.repondre(id, reponse));
    }

    // PATCH — répondre (superviseur)
    @PatchMapping("/{id}/repondre-superviseur")
    @PreAuthorize("hasRole('SUPERVISEUR')")
    public ResponseEntity<Map<String, Object>> repondreSuperviseur(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reponse = body != null ? body.get("reponse") : null;
        return ResponseEntity.ok(signalementService.repondreSuperviseur(id, reponse));
    }

    // PATCH — escalader
    @PatchMapping("/{id}/escalader")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISEUR')")
    public ResponseEntity<Map<String, Object>> escalader(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String note = body != null ? body.get("note") : null;
        return ResponseEntity.ok(signalementService.escalader(id, note));
    }
}
