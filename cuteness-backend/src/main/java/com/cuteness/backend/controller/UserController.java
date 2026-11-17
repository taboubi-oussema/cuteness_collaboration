package com.cuteness.backend.controller;

import com.cuteness.backend.dto.*;
import com.cuteness.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserService userService;

    
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

   
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable int id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

   
    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable int id,
                                                   @RequestBody UserUpdateRequest request) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

  
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable int id) {
        userService.deleteUser(id);
        return ResponseEntity.ok("Utilisateur supprimé avec succès");
    }

    @PatchMapping("/{id}/toggle-statut")
    public ResponseEntity<UserResponse> toggleStatut(@PathVariable int id) {
        return ResponseEntity.ok(userService.toggleStatut(id));
    }

    @PatchMapping("/{id}/reseau")
    public ResponseEntity<UserResponse> adminUpdateReseau(
            @PathVariable int id,
            @RequestBody AdminReseauUpdateRequest request) {
        return ResponseEntity.ok(userService.adminUpdateReseau(id, request));
    }

    @GetMapping("/{id}/filleuls")
    public ResponseEntity<List<UserResponse>> getFilleuls(@PathVariable int id) {
        return ResponseEntity.ok(userService.getFilleuls(id));
    }
}
