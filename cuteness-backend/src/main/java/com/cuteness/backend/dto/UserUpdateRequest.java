package com.cuteness.backend.dto;

import com.cuteness.backend.enums.Role;
import lombok.Data;

@Data
public class UserUpdateRequest {
    private String nom;
    private String email;
    private Role role;
}