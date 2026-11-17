package com.cuteness.backend.controller;

import com.cuteness.backend.service.PartnerRewardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rewards")
@RequiredArgsConstructor
public class PartnerRewardController {

    private final PartnerRewardService partnerRewardService;

    @GetMapping("/mes-recompenses")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> getMesRecompenses(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(partnerRewardService.getMesRecompenses(authentication.getName()));
    }
}
