package com.cuteness.backend.controller;

import com.cuteness.backend.service.ChallengeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/challenges")
@RequiredArgsConstructor
public class ChallengeController {

    private final ChallengeService challengeService;

    // ── Public / partner ──────────────────────────────────

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getActifs() {
        return ResponseEntity.ok(challengeService.getActiveChallenges());
    }

    @GetMapping("/mes-participations")
    public ResponseEntity<List<Map<String, Object>>> getMesParticipations(
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) return ResponseEntity.ok(List.of());
        return ResponseEntity.ok(challengeService.getMesParticipations(userDetails.getUsername()));
    }

    @PostMapping("/{id}/participer")
    public ResponseEntity<Map<String, Object>> participer(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(challengeService.participer(id, userDetails.getUsername()));
    }

    // ── Admin ─────────────────────────────────────────────

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAllAdmin() {
        return ResponseEntity.ok(challengeService.getAllChallenges());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(challengeService.createChallenge(body));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> update(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(challengeService.updateChallenge(id, body));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        challengeService.deleteChallenge(id);
        return ResponseEntity.noContent().build();
    }
}
