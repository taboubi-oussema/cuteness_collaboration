package com.cuteness.backend.entity;

import com.cuteness.backend.enums.StatutCommande;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "commandes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Commande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "date_commande")
    private LocalDateTime dateCommande;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", columnDefinition = "VARCHAR(20)")
    private StatutCommande statut;

    // ─── Pricing with discount ─────────────────────────────
    @Builder.Default
    @Column(name = "montant_original")
    private Double montantOriginal = 0.0;

    @Builder.Default
    @Column(name = "taux_reduction")
    private Double tauxReduction = 0.0;

    @Builder.Default
    @Column(name = "montant_reduction")
    private Double montantReduction = 0.0;

    @Builder.Default
    @Column(name = "montant_total")
    private Double montantTotal = 0.0;

    // ─── Delivery & payment ────────────────────────────────
    @Column(name = "adresse")
    private String adresse;

    @Column(name = "gouvernerat")
    private String gouvernerat;

    @Column(name = "ville")
    private String ville;

    @Column(name = "localite")
    private String localite;

    @Column(name = "mode_paiement")
    private String modePaiement;

    @Column(name = "option_remise")
    private String optionRemise;

    @Builder.Default
    @Column(name = "frais_livraison")
    private Double fraisLivraison = 9.0;

    @Builder.Default
    @Column(name = "remboursement_approuve")
    private Boolean remboursementApprouve = false;

    // ─── Navex delivery tracking ───────────────────────────
    @Column(name = "navex_ref")
    private String navexRef;

    @Column(name = "navex_statut")
    private String navexStatut;

    @Builder.Default
    @Column(name = "confirmation_comptable_requise")
    private Boolean confirmationComptableRequise = false;

    @Column(name = "type_confirmation")
    private String typeConfirmation;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User partenaire;

    @ManyToOne
    @JoinColumn(name = "superviseur_id")
    private User superviseur;

    @Builder.Default
    @OneToMany(mappedBy = "commande", cascade = CascadeType.ALL)
    private List<LigneCommande> lignes = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        this.dateCommande = LocalDateTime.now();
        this.statut = StatutCommande.EN_ATTENTE;
    }
}
