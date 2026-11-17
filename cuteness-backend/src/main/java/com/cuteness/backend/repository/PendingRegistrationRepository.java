package com.cuteness.backend.repository;

import com.cuteness.backend.entity.PendingRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PendingRegistrationRepository extends JpaRepository<PendingRegistration, Long> {
    Optional<PendingRegistration> findByEmail(String email);
    void deleteByEmail(String email);
    boolean existsByEmail(String email);
}
