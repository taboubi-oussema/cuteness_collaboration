package com.cuteness.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    @Size(max = 120, message = "L'email ne doit pas dépasser 120 caractères")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(max = 100, message = "Le mot de passe ne doit pas dépasser 100 caractères")
    private String motDePasse;
}
