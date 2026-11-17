package com.cuteness.backend.repository;

import com.cuteness.backend.entity.User;
import com.cuteness.backend.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByCodeParrainage(String code);
    Optional<User> findByCodeParrainage(String code);
    List<User> findByParrain(User parrain);
    List<User> findByParrainIsNullAndRole(Role role);
    long countByParrain(User parrain);
    long countByRole(Role role);
    List<User> findByRole(Role role);
}