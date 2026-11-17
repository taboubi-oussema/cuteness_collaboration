package com.cuteness.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "sous_pack_image")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SousPackImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sous_pack_id", nullable = false)
    private SousPack sousPack;

    @Column(name = "image_url", nullable = false)
    private String imageUrl;

    @Builder.Default
    private int ordre = 0;
}
