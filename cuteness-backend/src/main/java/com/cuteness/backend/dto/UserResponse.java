package com.cuteness.backend.dto;

import com.cuteness.backend.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserResponse {
    private int id;
    private String nom;
    private String email;
    private Role role;
    private boolean statut;
    private LocalDateTime dateCreation;
}