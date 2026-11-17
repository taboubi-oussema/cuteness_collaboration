package com.cuteness.backend.controller;

import com.cuteness.backend.service.PartnerRewardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rewards")
@RequiredArgsConstructor
public class PartnerRewardController {

    private final PartnerRewardService partnerRewardService;

    @GetMapping("/mes-recompenses")
    public ResponseEntity<List<Map<String, Object>>> getMesRecompenses(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(partnerRewardService.getMesRecompenses(userDetails.getUsername()));
    }
}
