package com.cuteness.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String email;
    private String nom;
    private Long id;
    private String role;
    private Double solde;
    private Integer niveau;
}