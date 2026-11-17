package com.cuteness.backend.dto;

import lombok.Data;

@Data
public class AdminReseauUpdateRequest {
    private Integer packId;
    private Double  solde;
    private String  modePaiement;
    private String  infoBancaire;
    private String  banque;
    private Boolean statut;
    private Integer parrainId;
    private String  role;
}
