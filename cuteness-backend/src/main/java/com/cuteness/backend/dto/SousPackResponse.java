package com.cuteness.backend.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SousPackResponse {
    private Long         id;
    private String       nom;
    private String       nomAr;
    private String       emoji;
    private String       theme;
    private List<String> produitsFr;
    private List<String> produitsAr;
    private String       imageUrl;
    private int          ordre;
    private int          stock;
    private List<String> images;
}
