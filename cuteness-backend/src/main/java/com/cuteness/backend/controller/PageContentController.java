package com.cuteness.backend.controller;

import com.cuteness.backend.entity.PageContent;
import com.cuteness.backend.service.PageContentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/content")
@RequiredArgsConstructor
public class PageContentController {

    private final PageContentService service;

    /** Public — page d'accueil, page packs, lecture du contenu sans authentification */
    @GetMapping
    public List<PageContent> getAll() {
        return service.getAll();
    }

    @GetMapping("/{section}")
    public List<PageContent> getBySection(@PathVariable String section) {
        return service.getBySection(section);
    }

    /** Save (upsert) a batch of content entries — admin only */
    @PostMapping("/save")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPERVISEUR')")
    public ResponseEntity<List<PageContent>> save(
            @RequestBody List<Map<String, String>> entries) {
        return ResponseEntity.ok(service.saveAll(entries));
    }
}
