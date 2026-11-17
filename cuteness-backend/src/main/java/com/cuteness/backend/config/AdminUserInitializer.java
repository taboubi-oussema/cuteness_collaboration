package com.cuteness.backend.config;

import com.cuteness.backend.entity.User;
import com.cuteness.backend.enums.Role;
import com.cuteness.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class AdminUserInitializer implements CommandLineRunner {

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        boolean adminExists = userRepository.findAll().stream()
                .anyMatch(u -> u.getRole() == Role.ADMIN);
        if (adminExists) return;

        User admin = User.builder()
                .nom("Admin Cuteness")
                .email("admin@cuteness.tn")
                .motDePasse(passwordEncoder.encode("Admin@123"))
                .role(Role.ADMIN)
                .statut(true)
                .emailVerified(true)
                .build();

        userRepository.save(admin);
        log.info("=======================================================");
        log.info("  Admin créé  →  admin@cuteness.tn  /  Admin@123");
        log.info("=======================================================");
    }
}
