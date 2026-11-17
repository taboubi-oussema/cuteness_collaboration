package com.cuteness.backend.controller;

import com.cuteness.backend.dto.*;
import com.cuteness.backend.security.ClientIpResolver;
import com.cuteness.backend.security.RateLimiter;
import com.cuteness.backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService      authService;
    private final RateLimiter      rateLimiter;
    private final ClientIpResolver clientIp;

    private static String norm(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    // ── LOGIN ──────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @RequestBody LoginRequest request, HttpServletRequest http) {
        String ip = clientIp.resolve(http);
        // Slows down password guessing: per IP overall, and per IP + account
        rateLimiter.check("login-ip:" + ip, 30, Duration.ofMinutes(15));
        rateLimiter.check("login:" + ip + "|" + norm(request.getEmail()), 8, Duration.ofMinutes(15));
        return ResponseEntity.ok(authService.login(request));
    }

    // ── REGISTER ───────────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(
            @RequestBody RegisterRequest request, HttpServletRequest http) {
        rateLimiter.check("register-ip:" + clientIp.resolve(http), 10, Duration.ofHours(1));
        return ResponseEntity.ok(
            Map.of("message", authService.register(request))
        );
    }

    // ── VERIFY OTP ─────────────────────────────────────────
    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, String>> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request, HttpServletRequest http) {
        // The code has only 1,000,000 possibilities: cap guesses per email regardless of IP
        rateLimiter.check("otp-email:" + norm(request.getEmail()), 5, Duration.ofMinutes(15));
        rateLimiter.check("otp-ip:" + clientIp.resolve(http), 30, Duration.ofMinutes(15));
        return ResponseEntity.ok(
            Map.of("message", authService.verifyOtp(request))
        );
    }

    // ── RESEND OTP ─────────────────────────────────────────
    @PostMapping("/resend-otp")
    public ResponseEntity<Map<String, String>> resendOtp(
            @Valid @RequestBody ResendOtpRequest request, HttpServletRequest http) {
        rateLimiter.check("resend-email:" + norm(request.getEmail()), 3, Duration.ofMinutes(10));
        rateLimiter.check("resend-ip:" + clientIp.resolve(http), 10, Duration.ofHours(1));
        return ResponseEntity.ok(
            Map.of("message", authService.resendOtp(request))
        );
    }

    // ── RESET PASSWORD — Étape 1 : demande email ───────────
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @RequestBody ResetPasswordRequest request, HttpServletRequest http) {
        rateLimiter.check("reset-email:" + norm(request.getEmail()), 3, Duration.ofHours(1));
        rateLimiter.check("reset-ip:" + clientIp.resolve(http), 10, Duration.ofHours(1));
        return ResponseEntity.ok(
            Map.of("message", authService.requestPasswordReset(request.getEmail()))
        );
    }

    // ── RESET PASSWORD — Étape 2 : nouveau mot de passe ────
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @RequestBody ChangePasswordRequest request, HttpServletRequest http) {
        rateLimiter.check("change-ip:" + clientIp.resolve(http), 10, Duration.ofHours(1));
        return ResponseEntity.ok(
            Map.of("message", authService.changePassword(request))
        );
    }
}
