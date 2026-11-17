package com.cuteness.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmerVirementRequest {
    private int partenaireId;
    private double montant;
    private String infoBancaire;
    private String typePayment;
    private String semaine;
}
