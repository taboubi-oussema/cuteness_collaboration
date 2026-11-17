package com.cuteness.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pack_upgrade_historique")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PackUpgradeHistorique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ancien_pack_id")
    private Pack ancienPack;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "nouveau_pack_id", nullable = false)
    private Pack nouveauPack;

    @Column(nullable = false)
    private double montantPaye;

    @Column(nullable = false)
    private LocalDateTime dateUpgrade;

    @PrePersist
    public void prePersist() {
        this.dateUpgrade = LocalDateTime.now();
    }
}
