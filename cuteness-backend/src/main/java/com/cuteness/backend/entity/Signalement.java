package com.cuteness.backend.entity;

import com.cuteness.backend.enums.PrioriteSignalement;
import com.cuteness.backend.enums.SourceSignalement;
import com.cuteness.backend.enums.StatutSignalement;
import com.cuteness.backend.enums.TypeSignalement;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "signalements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Signalement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private TypeSignalement type;

    private String sujet;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    private PrioriteSignalement priorite;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutSignalement statut = StatutSignalement.ENVOYE;

    @Enumerated(EnumType.STRING)
    private SourceSignalement source;

    private String auteur;

    @Column(name = "file_url")
    private String fileUrl;

    private LocalDateTime dateCreation;

    @Column(columnDefinition = "TEXT")
    private String noteEscalade;

    @Column(columnDefinition = "TEXT")
    private String reponseAdmin;

    @Column(columnDefinition = "TEXT")
    private String reponseSuperviseur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "superviseur_id")
    private User superviseur;

    @PrePersist
    public void prePersist() {
        this.dateCreation = LocalDateTime.now();
        if (this.statut == null) this.statut = StatutSignalement.ENVOYE;
        if (this.source == null) this.source = SourceSignalement.CLIENT;
        if (this.priorite == null) this.priorite = PrioriteSignalement.MOYENNE;
    }
}
