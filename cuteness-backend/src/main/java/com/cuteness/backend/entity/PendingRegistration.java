package com.cuteness.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pending_registration")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PendingRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String motDePasse; // already BCrypt-encoded

    @Column(nullable = false)
    private String telephone;

    private Integer packId;

    private String codeParrainage;

    @Column(nullable = false)
    private String region;

    @Column(nullable = false)
    private String modePaiement;

    private String banque;

    private String infoBancaire;

    @Column(nullable = false)
    private LocalDateTime expiryDate;

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(this.expiryDate);
    }
}
