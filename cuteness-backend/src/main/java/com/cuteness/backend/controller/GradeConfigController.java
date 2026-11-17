package com.cuteness.backend.controller;

import com.cuteness.backend.service.GradeConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/grade-configs")
@RequiredArgsConstructor
public class GradeConfigController {

    private final GradeConfigService gradeConfigService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAll() {
        return ResponseEntity.ok(gradeConfigService.getAll());
    }

    @GetMapping("/public")
    public ResponseEntity<List<Map<String, Object>>> getAllPublic() {
        return ResponseEntity.ok(gradeConfigService.getAll());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> update(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(gradeConfigService.update(id, body));
    }
}
