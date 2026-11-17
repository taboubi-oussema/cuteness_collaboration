package com.cuteness.backend.config;

import com.cuteness.backend.entity.User;
import com.cuteness.backend.enums.Role;
import com.cuteness.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class AdminUserInitializer implements CommandLineRunner {

    private static final int MIN_PASSWORD_LENGTH = 12;

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@cuteness.tn}")
    private String adminEmail;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        boolean adminExists = userRepository.findAll().stream()
                .anyMatch(u -> u.getRole() == Role.ADMIN);
        if (adminExists) return;

        if (adminPassword == null || adminPassword.length() < MIN_PASSWORD_LENGTH) {
            log.warn("No ADMIN account exists. Set ADMIN_INITIAL_PASSWORD (at least {} characters) "
                    + "and restart to create the first admin.", MIN_PASSWORD_LENGTH);
            return;
        }

        User admin = User.builder()
                .nom("Admin Cuteness")
                .email(adminEmail)
                .motDePasse(passwordEncoder.encode(adminPassword))
                .role(Role.ADMIN)
                .statut(true)
                .emailVerified(true)
                .build();

        userRepository.save(admin);
        log.info("First admin account created for {}. Remove ADMIN_INITIAL_PASSWORD from your environment now.",
                adminEmail);
    }
}
