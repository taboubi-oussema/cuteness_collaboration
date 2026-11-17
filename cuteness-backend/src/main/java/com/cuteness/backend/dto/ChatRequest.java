package com.cuteness.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.Map;

@Data
public class ChatRequest {

    @NotBlank(message = "Le message ne peut pas être vide")
    @Size(max = 1000, message = "Le message ne doit pas dépasser 1000 caractères")
    private String message;

    private Map<String, Object> context;
}
