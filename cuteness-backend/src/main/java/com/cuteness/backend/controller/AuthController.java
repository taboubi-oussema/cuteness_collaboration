package com.cuteness.backend.controller;

import com.cuteness.backend.dto.*;
import com.cuteness.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // ── LOGIN ──────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // ── REGISTER ───────────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(
            @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(
            Map.of("message", authService.register(request))
        );
    }

    // ── VERIFY OTP ─────────────────────────────────────────
    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, String>> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request) {
        return ResponseEntity.ok(
            Map.of("message", authService.verifyOtp(request))
        );
    }

    // ── RESEND OTP ─────────────────────────────────────────
    @PostMapping("/resend-otp")
    public ResponseEntity<Map<String, String>> resendOtp(
            @Valid @RequestBody ResendOtpRequest request) {
        return ResponseEntity.ok(
            Map.of("message", authService.resendOtp(request))
        );
    }

    // ── RESET PASSWORD — Étape 1 : demande email ───────────
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(
            Map.of("message", authService.requestPasswordReset(request.getEmail()))
        );
    }

    // ── RESET PASSWORD — Étape 2 : nouveau mot de passe ────
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @RequestBody ChangePasswordRequest request) {
        return ResponseEntity.ok(
            Map.of("message", authService.changePassword(request))
        );
    }
}
