package com.cuteness.backend.controller;

import com.cuteness.backend.dto.FormationRequest;
import com.cuteness.backend.dto.FormationResponse;
import com.cuteness.backend.service.FormationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/formations")
@RequiredArgsConstructor
public class FormationController {

    private final FormationService formationService;

    /** Public — accessible sans authentification (pour la home page) */
    @GetMapping
    public List<FormationResponse> getAll() {
        return formationService.getAll();
    }

    @GetMapping("/{id}")
    public FormationResponse getById(@PathVariable int id) {
        return formationService.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPERVISEUR')")
    public ResponseEntity<FormationResponse> create(@RequestBody FormationRequest req) {
        return ResponseEntity.ok(formationService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPERVISEUR')")
    public ResponseEntity<FormationResponse> update(@PathVariable int id,
                                                     @RequestBody FormationRequest req) {
        return ResponseEntity.ok(formationService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPERVISEUR')")
    public ResponseEntity<Void> delete(@PathVariable int id) {
        formationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
