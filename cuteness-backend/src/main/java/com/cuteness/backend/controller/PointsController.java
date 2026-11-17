package com.cuteness.backend.controller;

import com.cuteness.backend.service.PointsService;
import com.cuteness.backend.service.PointsSourceConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/points")
@RequiredArgsConstructor
public class PointsController {

    private final PointsService             pointsService;
    private final PointsSourceConfigService pointsSourceConfigService;

    @GetMapping("/mes-points")
    public ResponseEntity<Map<String, Object>> getMesPoints(Authentication authentication) {
        return ResponseEntity.ok(pointsService.getMesPoints(authentication.getName()));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<Map<String, Object>>> getLeaderboard() {
        return ResponseEntity.ok(pointsService.getLeaderboard());
    }

    // ── Public: source configs (lecture pour tous) ────────────────────────────

    @GetMapping("/sources")
    public ResponseEntity<List<Map<String, Object>>> getSourcesPublic() {
        return ResponseEntity.ok(pointsSourceConfigService.getAll());
    }

    // ── Admin: source configs ─────────────────────────────────────────────────

    @GetMapping("/admin/sources")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getSources() {
        return ResponseEntity.ok(pointsSourceConfigService.getAll());
    }

    @PutMapping("/admin/sources/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> updateSource(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(pointsSourceConfigService.update(id, body));
    }
}
