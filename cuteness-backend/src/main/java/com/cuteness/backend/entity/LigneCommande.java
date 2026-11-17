package com.cuteness.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;

@Entity
@Table(name = "lignes_commande")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LigneCommande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private int quantite;
    private double prixUnitaire;

    @ManyToOne
    @JoinColumn(name = "commande_id", nullable = false)
    private Commande commande;

    @ManyToOne
    @JoinColumn(name = "produit_id")
    @NotFound(action = NotFoundAction.IGNORE)
    private Produit produit;

    @ManyToOne
    @JoinColumn(name = "pack_id")
    @NotFound(action = NotFoundAction.IGNORE)
    private Pack pack;
}
