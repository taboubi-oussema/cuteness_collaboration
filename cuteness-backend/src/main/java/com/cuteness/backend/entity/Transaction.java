package com.cuteness.backend.entity;

import com.cuteness.backend.enums.TypeTransaction;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 20)
    private TypeTransaction type;

    private double montant;

    private LocalDateTime date;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // EN_ATTENTE → VALIDEE_ADMIN → VALIDEE | REFUSEE
    private String statut;

    /** MLM level: 1 = direct parrain, 2 = grand-parrain, 3 = arrière grand-parrain */
    @Column(name = "niveau")
    private Integer niveau;

    /** Human-readable source, e.g. "Pack Gold — Ahmed Ben Ali" or "CMD-007 — Sara Fathi" */
    @Column(name = "source_label")
    private String sourceLabel;

    /** Name of the user who triggered the commission (acheteur) */
    @Column(name = "source_user_nom")
    private String sourceUserNom;

    /** For ACHAT transactions: the gross amount before reduction (montantOriginal) */
    @Builder.Default
    @Column(name = "montant_original")
    private Double montantOriginal = 0.0;

    /** For ACHAT transactions: the reduction actually applied */
    @Builder.Default
    @Column(name = "montant_reduction")
    private Double montantReduction = 0.0;

    @PrePersist
    public void prePersist() {
        this.date = LocalDateTime.now();
        if (this.statut == null && this.type == TypeTransaction.COMMISSION) {
            this.statut = "EN_ATTENTE";
        }
    }
}
