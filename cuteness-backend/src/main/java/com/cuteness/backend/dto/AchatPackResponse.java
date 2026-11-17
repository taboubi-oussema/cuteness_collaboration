package com.cuteness.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AchatPackResponse {
    private String message;
    private String nouveauPack;
    private double prixPaye;
    private double nouveauSolde;
    private double nouveauTauxCommission;
    private double nouveauTauxReduction;
}
