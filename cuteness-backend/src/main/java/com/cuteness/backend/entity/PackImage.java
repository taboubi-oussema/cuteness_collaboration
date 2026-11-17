package com.cuteness.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "pack_image")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PackImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pack_id", nullable = false)
    private Pack pack;

    @Column(name = "image_url", nullable = false)
    private String imageUrl;

    @Builder.Default
    private int ordre = 0;
}
