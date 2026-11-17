package com.cuteness.backend.service;

import com.cuteness.backend.dto.FormationRequest;
import com.cuteness.backend.dto.FormationResponse;
import com.cuteness.backend.entity.Formation;
import com.cuteness.backend.repository.FormationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FormationService {

    private final FormationRepository formationRepository;

    public List<FormationResponse> getAll() {
        return formationRepository.findAllByOrderByOrdreAsc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public FormationResponse getById(int id) {
        return toResponse(formationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Formation introuvable")));
    }

    public FormationResponse create(FormationRequest req) {
        Formation f = Formation.builder()
                .titre(req.getTitre())
                .description(req.getDescription())
                .duree(req.getDuree())
                .niveau(req.getNiveau())
                .videoUrl(req.getVideoUrl())
                .accesRequis(req.getAccesRequis() != null ? req.getAccesRequis() : "TOUS")
                .imageUrl(req.getImageUrl())
                .ordre(req.getOrdre())
                .build();
        return toResponse(formationRepository.save(f));
    }

    public FormationResponse update(int id, FormationRequest req) {
        Formation f = formationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Formation introuvable"));
        if (req.getTitre()       != null) f.setTitre(req.getTitre());
        if (req.getDescription() != null) f.setDescription(req.getDescription());
        if (req.getDuree()       != null) f.setDuree(req.getDuree());
        if (req.getNiveau()      != null) f.setNiveau(req.getNiveau());
        if (req.getVideoUrl()    != null) f.setVideoUrl(req.getVideoUrl());
        if (req.getAccesRequis() != null) f.setAccesRequis(req.getAccesRequis());
        if (req.getImageUrl()    != null) f.setImageUrl(req.getImageUrl());
        f.setOrdre(req.getOrdre());
        return toResponse(formationRepository.save(f));
    }

    public void delete(int id) {
        if (!formationRepository.existsById(id))
            throw new RuntimeException("Formation introuvable");
        formationRepository.deleteById(id);
    }

    private FormationResponse toResponse(Formation f) {
        return FormationResponse.builder()
                .id(f.getId())
                .titre(f.getTitre())
                .description(f.getDescription())
                .duree(f.getDuree())
                .niveau(f.getNiveau())
                .videoUrl(f.getVideoUrl())
                .accesRequis(f.getAccesRequis())
                .imageUrl(f.getImageUrl())
                .ordre(f.getOrdre())
                .build();
    }
}
