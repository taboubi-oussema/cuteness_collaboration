package com.cuteness.backend.entity;

import com.cuteness.backend.enums.StatutVirement;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "virements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Virement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne
    @JoinColumn(name = "partenaire_id", nullable = false)
    private User partenaire;

    @Column(nullable = false)
    private double montant;

    @Column(name = "info_bancaire")
    private String infoBancaire;

    @Column(name = "type_payment")
    private String typePayment;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "statut")
    private StatutVirement statut = StatutVirement.EN_ATTENTE;

    @Column(name = "date_virement")
    private LocalDateTime dateVirement;

    @Column(name = "semaine")
    private String semaine;

    @PrePersist
    public void prePersist() {
        this.dateVirement = LocalDateTime.now();
        this.statut = StatutVirement.EN_ATTENTE;
    }
}
