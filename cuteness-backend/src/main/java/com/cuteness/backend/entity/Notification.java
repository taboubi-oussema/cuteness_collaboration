package com.cuteness.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User destinataire;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String message;

    /** COMMISSION_ATTENTE | COMMISSION_VALIDEE | COMMISSION_REFUSEE | LIVRAISON | PARRAINAGE | COMPTE_A_APPROUVER */
    @Column(nullable = false)
    private String type;

    /** Optional: userId of the partner to approve (set for COMPTE_A_APPROUVER type) */
    private Long referenceId;

    @Builder.Default
    private boolean lu = false;

    @Builder.Default
    private LocalDateTime dateCreation = LocalDateTime.now();
}
