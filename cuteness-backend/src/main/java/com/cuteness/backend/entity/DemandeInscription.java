package com.cuteness.backend.entity;

import com.cuteness.backend.enums.StatutDemande;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "demandes_inscription")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DemandeInscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The newly registered user (statut=false until admin approves) */
    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User utilisateur;

    /** The parrain who invited this user */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "parrain_id")
    private User parrain;

    /** The supervisor who claimed this request */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "superviseur_id")
    private User superviseur;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutDemande statut = StatutDemande.NOUVELLE;

    @Builder.Default
    private LocalDateTime dateCreation = LocalDateTime.now();

    private LocalDateTime datePriseEnCharge;
    private LocalDateTime dateTraitement;
    private LocalDateTime dateLivraison;

    /** Navex tracking reference, set when colis is created */
    private String navexRef;
}
