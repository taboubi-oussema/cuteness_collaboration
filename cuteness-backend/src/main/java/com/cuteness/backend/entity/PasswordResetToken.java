package com.cuteness.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "password_reset_token")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(nullable = false)
    private String email;

    @Column(name = "expiry_date", nullable = false)
    private LocalDateTime expiryDate;

    public PasswordResetToken(String token, String email) {
        this.token = token;
        this.email = email;
        this.expiryDate = LocalDateTime.now().plusHours(1); // 1 hour validity
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(this.expiryDate);
    }
}
