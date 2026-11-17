package com.cuteness.backend.service;

import com.cuteness.backend.dto.*;
import com.cuteness.backend.entity.Pack;
import com.cuteness.backend.entity.PackImage;
import com.cuteness.backend.entity.SousPack;
import com.cuteness.backend.entity.SousPackImage;
import com.cuteness.backend.repository.PackImageRepository;
import com.cuteness.backend.repository.PackRepository;
import com.cuteness.backend.repository.SousPackImageRepository;
import com.cuteness.backend.repository.SousPackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PackService {

    private final PackRepository          packRepository;
    private final SousPackRepository      sousPackRepository;
    private final PackImageRepository     packImageRepository;
    private final SousPackImageRepository sousPackImageRepository;

    

    public List<PackResponse> getAllPacks() {
        return packRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public PackResponse getPackById(int id) {
        return toResponse(findPack(id));
    }

    @Transactional
    public PackResponse createPack(PackRequest req) {
        if (packRepository.existsByNom(req.getNom()))
            throw new RuntimeException("Un pack avec ce nom existe déjà");
        Pack pack = Pack.builder()
                .nom(req.getNom()).nomAr(req.getNomAr())
                .description(req.getDescription())
                .prix(req.getPrix())
                .tauxCommissionDirect(req.getTauxCommissionDirect())
                .tauxCommissionNiveau2(req.getTauxCommissionNiveau2())
                .tauxCommissionNiveau3(req.getTauxCommissionNiveau3())
                .tauxReduction(req.getTauxReduction())
                .imageUrl(req.getImageUrl())
                .emoji(req.getEmoji()).color(req.getColor())
                .niveaux(req.getNiveaux() > 0 ? req.getNiveaux() : 1)
                .taglineFr(req.getTaglineFr()).taglineAr(req.getTaglineAr())
                .featuresFr(req.getFeaturesFr()).featuresAr(req.getFeaturesAr())
                .advantagesFrJson(req.getAdvantagesFrJson())
                .advantagesArJson(req.getAdvantagesArJson())
                .build();
        return toResponse(packRepository.save(pack));
    }

    @Transactional
    public PackResponse updatePack(int id, PackRequest req) {
        Pack pack = findPack(id);
        if (req.getNom() != null && !req.getNom().equals(pack.getNom()) && packRepository.existsByNom(req.getNom()))
            throw new RuntimeException("Un pack avec ce nom existe déjà");

        if (req.getNom()         != null) pack.setNom(req.getNom());
        if (req.getNomAr()       != null) pack.setNomAr(req.getNomAr());
        if (req.getDescription() != null) pack.setDescription(req.getDescription());
        if (req.getPrix()        > 0)     pack.setPrix(req.getPrix());
        if (req.getTauxCommissionDirect() > 0)  pack.setTauxCommissionDirect(req.getTauxCommissionDirect());
        if (req.getTauxCommissionNiveau2() >= 0) pack.setTauxCommissionNiveau2(req.getTauxCommissionNiveau2());
        if (req.getTauxCommissionNiveau3() >= 0) pack.setTauxCommissionNiveau3(req.getTauxCommissionNiveau3());
        if (req.getTauxReduction() >= 0)  pack.setTauxReduction(req.getTauxReduction());
        if (req.getImageUrl()    != null) pack.setImageUrl(req.getImageUrl());
        if (req.getEmoji()       != null) pack.setEmoji(req.getEmoji());
        if (req.getColor()       != null) pack.setColor(req.getColor());
        if (req.getNiveaux()     > 0)     pack.setNiveaux(req.getNiveaux());
        if (req.getTaglineFr()   != null) pack.setTaglineFr(req.getTaglineFr());
        if (req.getTaglineAr()   != null) pack.setTaglineAr(req.getTaglineAr());
        if (req.getFeaturesFr()  != null) pack.setFeaturesFr(req.getFeaturesFr());
        if (req.getFeaturesAr()  != null) pack.setFeaturesAr(req.getFeaturesAr());
        if (req.getAdvantagesFrJson() != null) pack.setAdvantagesFrJson(req.getAdvantagesFrJson());
        if (req.getAdvantagesArJson() != null) pack.setAdvantagesArJson(req.getAdvantagesArJson());

        return toResponse(packRepository.save(pack));
    }

    public void deletePack(int id) {
        if (!packRepository.existsById(id)) throw new RuntimeException("Pack introuvable");
        packRepository.deleteById(id);
    }

    

    public SousPackResponse addSousPack(int packId, SousPackRequest req) {
        Pack pack = findPack(packId);
        SousPack sp = SousPack.builder()
                .pack(pack)
                .nom(req.getNom()).nomAr(req.getNomAr())
                .emoji(req.getEmoji()).theme(req.getTheme())
                .produitsFr(req.getProduitsFr()).produitsAr(req.getProduitsAr())
                .imageUrl(req.getImageUrl()).ordre(req.getOrdre())
                .stock(req.getStock())
                .build();
        return toSpResponse(sousPackRepository.save(sp));
    }

    public SousPackResponse updateSousPack(int packId, Long spId, SousPackRequest req) {
        SousPack sp = sousPackRepository.findById(spId)
                .orElseThrow(() -> new RuntimeException("Sous-pack introuvable"));
        if (sp.getPack().getId() != packId) throw new RuntimeException("Sous-pack n'appartient pas à ce pack");

        if (req.getNom()        != null) sp.setNom(req.getNom());
        if (req.getNomAr()      != null) sp.setNomAr(req.getNomAr());
        if (req.getEmoji()      != null) sp.setEmoji(req.getEmoji());
        if (req.getTheme()      != null) sp.setTheme(req.getTheme());
        if (req.getProduitsFr() != null) sp.setProduitsFr(req.getProduitsFr());
        if (req.getProduitsAr() != null) sp.setProduitsAr(req.getProduitsAr());
        if (req.getImageUrl()   != null) sp.setImageUrl(req.getImageUrl());
        sp.setOrdre(req.getOrdre());
        if (req.getStock() >= 0) sp.setStock(req.getStock());

        return toSpResponse(sousPackRepository.save(sp));
    }

    public void deleteSousPack(int packId, Long spId) {
        SousPack sp = sousPackRepository.findById(spId)
                .orElseThrow(() -> new RuntimeException("Sous-pack introuvable"));
        if (sp.getPack().getId() != packId) throw new RuntimeException("Sous-pack n'appartient pas à ce pack");
        sousPackRepository.delete(sp);
    }

    

    public List<String> addImage(int packId, String imageUrl) {
        Pack pack = findPack(packId);
        int ordre = (int) packImageRepository.findAllByPackIdOrderByOrdreAsc(packId).size();
        packImageRepository.save(PackImage.builder().pack(pack).imageUrl(imageUrl).ordre(ordre).build());
        return packImageRepository.findAllByPackIdOrderByOrdreAsc(packId)
                .stream().map(PackImage::getImageUrl).collect(Collectors.toList());
    }

    @Transactional
    public List<String> deleteImage(int packId, Long imgId) {
        PackImage img = packImageRepository.findById(imgId)
                .orElseThrow(() -> new RuntimeException("Image introuvable"));
        if (img.getPack().getId() != packId) throw new RuntimeException("Image n'appartient pas à ce pack");
        packImageRepository.delete(img);
        return packImageRepository.findAllByPackIdOrderByOrdreAsc(packId)
                .stream().map(PackImage::getImageUrl).collect(Collectors.toList());
    }

    @Transactional
    public List<String> deleteImageByUrl(int packId, String imageUrl) {
        packImageRepository.findAllByPackIdOrderByOrdreAsc(packId).stream()
                .filter(i -> i.getImageUrl().equals(imageUrl)).findFirst()
                .ifPresent(packImageRepository::delete);
        return packImageRepository.findAllByPackIdOrderByOrdreAsc(packId)
                .stream().map(PackImage::getImageUrl).collect(Collectors.toList());
    }

    

    private PackResponse toResponse(Pack p) {
        List<SousPackResponse> spList = p.getSousPacks() == null ? Collections.emptyList() :
                p.getSousPacks().stream().map(this::toSpResponse).collect(Collectors.toList());
        List<String> imgList = p.getImages() == null ? Collections.emptyList() :
                p.getImages().stream().map(PackImage::getImageUrl).collect(Collectors.toList());

        return PackResponse.builder()
                .id(p.getId()).nom(p.getNom()).nomAr(p.getNomAr())
                .description(p.getDescription()).prix(p.getPrix())
                .tauxCommissionDirect(p.getTauxCommissionDirect())
                .tauxCommissionNiveau2(p.getTauxCommissionNiveau2())
                .tauxCommissionNiveau3(p.getTauxCommissionNiveau3())
                .tauxReduction(p.getTauxReduction())
                .imageUrl(p.getImageUrl()).emoji(p.getEmoji()).color(p.getColor())
                .niveaux(p.getNiveaux())
                .taglineFr(p.getTaglineFr()).taglineAr(p.getTaglineAr())
                .featuresFr(p.getFeaturesFr()).featuresAr(p.getFeaturesAr())
                .advantagesFrJson(p.getAdvantagesFrJson())
                .advantagesArJson(p.getAdvantagesArJson())
                .sousPacks(spList).images(imgList)
                .build();
    }

    

    public List<String> addSousPackImage(Long spId, String imageUrl) {
        SousPack sp = sousPackRepository.findById(spId)
                .orElseThrow(() -> new RuntimeException("Sous-pack introuvable"));
        int ordre = sousPackImageRepository.findAllBySousPackIdOrderByOrdreAsc(spId).size();
        sousPackImageRepository.save(SousPackImage.builder()
                .sousPack(sp).imageUrl(imageUrl).ordre(ordre).build());
        return sousPackImageRepository.findAllBySousPackIdOrderByOrdreAsc(spId)
                .stream().map(SousPackImage::getImageUrl).collect(Collectors.toList());
    }

    @Transactional
    public List<String> deleteSousPackImageByUrl(Long spId, String imageUrl) {
        sousPackImageRepository.findAllBySousPackIdOrderByOrdreAsc(spId).stream()
                .filter(i -> i.getImageUrl().equals(imageUrl)).findFirst()
                .ifPresent(sousPackImageRepository::delete);
        return sousPackImageRepository.findAllBySousPackIdOrderByOrdreAsc(spId)
                .stream().map(SousPackImage::getImageUrl).collect(Collectors.toList());
    }

    private SousPackResponse toSpResponse(SousPack sp) {
        List<String> imgList = sp.getImages() == null ? Collections.emptyList() :
                sp.getImages().stream().map(SousPackImage::getImageUrl).collect(Collectors.toList());
        return SousPackResponse.builder()
                .id(sp.getId()).nom(sp.getNom()).nomAr(sp.getNomAr())
                .emoji(sp.getEmoji()).theme(sp.getTheme())
                .produitsFr(splitPipe(sp.getProduitsFr()))
                .produitsAr(splitPipe(sp.getProduitsAr()))
                .imageUrl(sp.getImageUrl()).ordre(sp.getOrdre())
                .stock(sp.getStock())
                .images(imgList)
                .build();
    }

    private List<String> splitPipe(String raw) {
        if (raw == null || raw.isBlank()) return Collections.emptyList();
        return Arrays.stream(raw.split("\\|"))
                .map(String::trim).filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    private Pack findPack(int id) {
        return packRepository.findById(id).orElseThrow(() -> new RuntimeException("Pack introuvable"));
    }
}
