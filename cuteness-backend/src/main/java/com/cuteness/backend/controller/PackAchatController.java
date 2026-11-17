package com.cuteness.backend.controller;

import com.cuteness.backend.dto.*;
import com.cuteness.backend.service.PackAchatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/partenaire")
@RequiredArgsConstructor
public class PackAchatController {

    private final PackAchatService packAchatService;

    @PostMapping("/acheter-pack")
    @PreAuthorize("hasRole('PARTENAIRE')")
    public ResponseEntity<AchatPackResponse> acheterPack(
            @RequestBody AchatPackRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(
            packAchatService.acheterPack(authentication.getName(), request)
        );
    }
}
