package com.cuteness.backend.dto;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmerVirementRequest {
    private int partenaireId;

    @Positive(message = "Le montant doit être supérieur à zéro")
    private double montant;

    @Size(max = 255)
    private String infoBancaire;

    @Size(max = 50)
    private String typePayment;

    @Size(max = 50)
    private String semaine;
}
