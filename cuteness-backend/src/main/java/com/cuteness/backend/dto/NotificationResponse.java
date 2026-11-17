package com.cuteness.backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NotificationResponse {
    private int id;               // commande id
    private String reference;     // e.g. "CMD-001"
    private String type;          // always "ORDER_STATUS"
    private String statut;        // EN_ATTENTE | LIVREE | ANNULEE
    private String title;         // e.g. "Commande #CMD-001 – En attente"
    private String message;       // descriptive sentence
    private double montant;       // montantTotal of the order
    private LocalDateTime date;            // dateCommande
}
