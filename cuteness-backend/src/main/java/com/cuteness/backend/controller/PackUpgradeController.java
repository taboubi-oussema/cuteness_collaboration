package com.cuteness.backend.controller;

import com.cuteness.backend.service.PackUpgradeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/packs/upgrade")
@RequiredArgsConstructor
public class PackUpgradeController {

    private final PackUpgradeService packUpgradeService;

    @GetMapping("/disponibles")
    @PreAuthorize("hasRole('PARTENAIRE')")
    public ResponseEntity<List<Map<String, Object>>> disponibles(Authentication auth) {
        return ResponseEntity.ok(packUpgradeService.getPacksDisponibles(auth.getName()));
    }

    @PostMapping("/{packId}")
    @PreAuthorize("hasRole('PARTENAIRE')")
    public ResponseEntity<Map<String, Object>> upgrader(
            @PathVariable int packId, Authentication auth) {
        return ResponseEntity.ok(packUpgradeService.upgraderPack(auth.getName(), packId));
    }

    @GetMapping("/historique")
    @PreAuthorize("hasRole('PARTENAIRE')")
    public ResponseEntity<List<Map<String, Object>>> monHistorique(Authentication auth) {
        return ResponseEntity.ok(packUpgradeService.getMonHistorique(auth.getName()));
    }

    /** All users' upgrade history — admin only (was open to everyone). */
    @GetMapping("/historique/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> tousHistoriques() {
        return ResponseEntity.ok(packUpgradeService.getAllHistoriques());
    }
}
