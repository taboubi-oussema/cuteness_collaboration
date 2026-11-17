package com.cuteness.backend.service;

import com.cuteness.backend.dto.AvisProduitRequest;
import com.cuteness.backend.dto.AvisProduitResponse;
import com.cuteness.backend.entity.AvisProduit;
import com.cuteness.backend.entity.Produit;
import com.cuteness.backend.entity.User;
import com.cuteness.backend.repository.AvisProduitRepository;
import com.cuteness.backend.repository.ProduitRepository;
import com.cuteness.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AvisProduitService {

    private final AvisProduitRepository avisRepo;
    private final ProduitRepository produitRepo;
    private final UserRepository userRepo;

    public AvisProduitResponse addAvis(int produitId, AvisProduitRequest req, String userEmail) {
        Produit produit = produitRepo.findById(produitId)
                .orElseThrow(() -> new RuntimeException("Produit introuvable"));
        User user = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        AvisProduit avis = AvisProduit.builder()
                .produit(produit)
                .user(user)
                .contenu(req.getContenu())
                .imageUrl(req.getImageUrl())
                .build();

        return toResponse(avisRepo.save(avis));
    }

    public List<AvisProduitResponse> getAvisByProduit(int produitId) {
        return avisRepo.findByProduitIdOrderByDateCreationDesc(produitId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public void deleteAvis(int avisId) {
        avisRepo.deleteById(avisId);
    }

    private AvisProduitResponse toResponse(AvisProduit a) {
        return AvisProduitResponse.builder()
                .id(a.getId())
                .contenu(a.getContenu())
                .imageUrl(a.getImageUrl())
                .dateCreation(a.getDateCreation())
                .auteurNom(a.getUser().getNom())
                .userId(a.getUser().getId())
                .build();
    }
}
