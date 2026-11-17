package com.cuteness.backend.controller;

import com.cuteness.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /** Tout utilisateur authentifié voit ses propres notifications */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getMesNotifications(Authentication authentication) {
        return ResponseEntity.ok(notificationService.getMesNotifications(authentication.getName()));
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Object>> countNonLues(Authentication authentication) {
        long count = notificationService.countNonLues(authentication.getName());
        return ResponseEntity.ok(Map.of("nonLues", count));
    }

    @PostMapping("/marquer-lues")
    public ResponseEntity<Void> marquerToutesLues(Authentication authentication) {
        notificationService.marquerToutesLues(authentication.getName());
        return ResponseEntity.ok().build();
    }
}
