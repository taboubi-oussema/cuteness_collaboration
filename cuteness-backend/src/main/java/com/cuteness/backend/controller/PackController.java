package com.cuteness.backend.controller;

import com.cuteness.backend.dto.*;
import com.cuteness.backend.service.PackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/packs")
@RequiredArgsConstructor
public class PackController {

    private final PackService packService;

    // ── Public read ──────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<PackResponse>> getAll() {
        return ResponseEntity.ok(packService.getAllPacks());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PackResponse> getById(@PathVariable int id) {
        return ResponseEntity.ok(packService.getPackById(id));
    }

    // ── Admin CRUD ───────────────────────────────────────────
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISEUR')")
    public ResponseEntity<PackResponse> create(@RequestBody PackRequest req) {
        return ResponseEntity.ok(packService.createPack(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISEUR')")
    public ResponseEntity<PackResponse> update(@PathVariable int id, @RequestBody PackRequest req) {
        return ResponseEntity.ok(packService.updatePack(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISEUR')")
    public ResponseEntity<String> delete(@PathVariable int id) {
        packService.deletePack(id);
        return ResponseEntity.ok("Pack supprimé");
    }

    // ── Sous-packs ───────────────────────────────────────────
    @PostMapping("/{id}/sous-packs")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISEUR')")
    public ResponseEntity<SousPackResponse> addSousPack(@PathVariable int id,
                                                         @RequestBody SousPackRequest req) {
        return ResponseEntity.ok(packService.addSousPack(id, req));
    }

    @PutMapping("/{id}/sous-packs/{spId}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISEUR')")
    public ResponseEntity<SousPackResponse> updateSousPack(@PathVariable int id,
                                                             @PathVariable Long spId,
                                                             @RequestBody SousPackRequest req) {
        return ResponseEntity.ok(packService.updateSousPack(id, spId, req));
    }

    @DeleteMapping("/{id}/sous-packs/{spId}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISEUR')")
    public ResponseEntity<String> deleteSousPack(@PathVariable int id, @PathVariable Long spId) {
        packService.deleteSousPack(id, spId);
        return ResponseEntity.ok("Sous-pack supprimé");
    }

    // ── Images ───────────────────────────────────────────────
    @PostMapping("/{id}/images")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISEUR')")
    public ResponseEntity<List<String>> addImage(@PathVariable int id,
                                                  @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(packService.addImage(id, body.get("imageUrl")));
    }

    @DeleteMapping("/{id}/images/{imgId}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISEUR')")
    public ResponseEntity<List<String>> deleteImage(@PathVariable int id, @PathVariable Long imgId) {
        return ResponseEntity.ok(packService.deleteImage(id, imgId));
    }

    @PostMapping("/{id}/images/delete-by-url")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISEUR')")
    public ResponseEntity<List<String>> deleteImageByUrl(@PathVariable int id,
                                                          @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(packService.deleteImageByUrl(id, body.get("imageUrl")));
    }

    // ── Sous-pack images ─────────────────────────────────────
    @PostMapping("/{id}/sous-packs/{spId}/images")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISEUR')")
    public ResponseEntity<List<String>> addSousPackImage(@PathVariable int id,
                                                          @PathVariable Long spId,
                                                          @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(packService.addSousPackImage(spId, body.get("imageUrl")));
    }

    @PostMapping("/{id}/sous-packs/{spId}/images/delete-by-url")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISEUR')")
    public ResponseEntity<List<String>> deleteSousPackImageByUrl(@PathVariable int id,
                                                                  @PathVariable Long spId,
                                                                  @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(packService.deleteSousPackImageByUrl(spId, body.get("imageUrl")));
    }
}
