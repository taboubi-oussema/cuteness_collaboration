package com.cuteness.backend.dto;

import lombok.Data;

@Data
public class ChangePasswordRequest {
    private String token;
    private String nouveauMotDePasse;
    private String confirmation;
}