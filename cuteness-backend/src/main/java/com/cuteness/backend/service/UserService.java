package com.cuteness.backend.service;

import com.cuteness.backend.dto.*;
import com.cuteness.backend.entity.Pack;
import com.cuteness.backend.entity.User;
import com.cuteness.backend.enums.Role;
import com.cuteness.backend.repository.PackRepository;
import com.cuteness.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PackRepository  packRepository;

    
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    
    public UserResponse getUserById(int id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        return toResponse(user);
    }

    
    public UserResponse updateUser(int id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if (request.getNom() != null) 
            user.setNom(request.getNom());

        if (request.getEmail() != null) {
            if (!request.getEmail().equals(user.getEmail()) &&
                userRepository.existsByEmail(request.getEmail()))
                throw new RuntimeException("Email déjà utilisé");
            user.setEmail(request.getEmail());
        }

        if (request.getRole() != null) 
            user.setRole(request.getRole());

        return toResponse(userRepository.save(user));
    }

   
    public void deleteUser(int id) {
        if (!userRepository.existsById(id))
            throw new RuntimeException("Utilisateur introuvable");
        userRepository.deleteById(id);
    }

    
    public UserResponse toggleStatut(int id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        user.setStatut(!user.isStatut());
        return toResponse(userRepository.save(user));
    }

    public UserResponse adminUpdateReseau(int id, AdminReseauUpdateRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if (req.getPackId() != null) {
            Pack pack = packRepository.findById(req.getPackId())
                    .orElseThrow(() -> new RuntimeException("Pack introuvable"));
            user.setPack(pack);
        }
        if (req.getSolde()        != null) user.setSoldeInterne(req.getSolde());
        if (req.getModePaiement() != null) user.setModePaiement(req.getModePaiement());
        if (req.getInfoBancaire() != null) user.setInfoBancaire(req.getInfoBancaire());
        if (req.getBanque()       != null) user.setBanque(req.getBanque());
        if (req.getStatut()       != null) user.setStatut(req.getStatut());
        if (req.getRole()         != null) {
            try {
                Role newRole = Role.valueOf(req.getRole().toUpperCase());
                user.setRole(newRole);
            } catch (IllegalArgumentException ignored) {}
        }
        if (req.getParrainId()    != null) {
            if (req.getParrainId() == 0) {
                user.setParrain(null);
            } else {
                User parrain = userRepository.findById(req.getParrainId())
                        .orElseThrow(() -> new RuntimeException("Parrain introuvable"));
                user.setParrain(parrain);
            }
        }

        return toResponse(userRepository.save(user));
    }

    public List<UserResponse> getFilleuls(int parrainId) {
        User parrain = userRepository.findById(parrainId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        return userRepository.findByParrain(parrain).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .nom(user.getNom())
                .email(user.getEmail())
                .role(user.getRole())
                .statut(user.isStatut())
                .dateCreation(user.getDateCreation())
                .build();
    }
}