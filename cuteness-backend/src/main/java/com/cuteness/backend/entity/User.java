package com.cuteness.backend.entity;

import com.cuteness.backend.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String nom;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "mot_de_passe", nullable = false)
    private String motDePasse;

    private boolean statut;

    @Builder.Default
    @Column(name = "email_verified", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean emailVerified = false;

    @Column(name = "date_creation")
    private LocalDateTime dateCreation;

    @Enumerated(EnumType.STRING)
    private Role role;

    // ─── Financials ────────────────────────────────────────
    @Builder.Default
    @Column(name = "solde_interne")
    private Double soldeInterne = 0.0;

    // ─── Boutique discount from pack ───────────────────────
    @Builder.Default
    @Column(name = "taux_reduction")
    private Double tauxReduction = 0.0;

    // ─── MLM fields ────────────────────────────────────────
    @Builder.Default
    @Column(name = "niveau", columnDefinition = "INT DEFAULT 1")
    private Integer niveau = 1;

    @Column(name = "code_parrainage", unique = true)
    private String codeParrainage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parrain_id")
    private User parrain;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "pack_id")
    private Pack pack;

    // ─── Informations personnelles ─────────────────────────
    @Column(name = "telephone")
    private String telephone;

    @Column(name = "region")
    private String region;

    // ─── Paiement ──────────────────────────────────────────
    @Column(name = "mode_paiement")
    private String modePaiement;

    @Column(name = "banque")
    private String banque;

    @Column(name = "info_bancaire")
    private String infoBancaire;

    @PrePersist
    public void prePersist() {
        this.dateCreation = LocalDateTime.now();
        if (this.soldeInterne == null)  this.soldeInterne  = 0.0;
        if (this.tauxReduction == null) this.tauxReduction = 0.0;
    }
}
