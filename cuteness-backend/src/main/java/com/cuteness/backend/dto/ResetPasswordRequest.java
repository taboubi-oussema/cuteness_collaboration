package com.cuteness.backend.dto;

import lombok.Data;

@Data
public class ResetPasswordRequest {
    private String email;
}