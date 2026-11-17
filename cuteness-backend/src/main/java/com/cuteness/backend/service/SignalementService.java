package com.cuteness.backend.service;

import com.cuteness.backend.entity.Signalement;
import com.cuteness.backend.entity.User;
import com.cuteness.backend.enums.*;
import com.cuteness.backend.repository.SignalementRepository;
import com.cuteness.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SignalementService {

    private final SignalementRepository repository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    private static final String UPLOAD_DIR = "uploads/signalements/";

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAll() {
        return repository.findAllByOrderByDateCreationDesc()
                .stream().map(this::toMap).toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMesSignalements(String email) {
        User user = findUser(email);
        return repository.findByCreatedByOrderByDateCreationDesc(user)
                .stream().map(this::toMap).toList();
    }

    @Transactional
    public Map<String, Object> create(String email, String type, String description,
                                       String priorite, MultipartFile file) {
        User user = findUser(email);

        Signalement s = new Signalement();
        s.setCreatedBy(user);
        s.setAuteur(user.getNom());
        s.setType(TypeSignalement.valueOf(type));
        s.setDescription(description);
        s.setPriorite(priorite != null ? PrioriteSignalement.valueOf(priorite) : PrioriteSignalement.MOYENNE);
        s.setSource(user.getRole() == Role.COMPTABLE
                ? SourceSignalement.COMPTABLE : SourceSignalement.CLIENT);
        s.setSujet("[" + type + "] " + user.getNom());

        // Assigne automatiquement un superviseur
        List<User> superviseurs = userRepository.findByRole(Role.SUPERVISEUR);
        if (!superviseurs.isEmpty()) {
            s.setSuperviseur(superviseurs.get(0));
        }

        // Traite le fichier optionnel
        if (file != null && !file.isEmpty()) {
            try {
                String fileUrl = saveFile(file);
                s.setFileUrl(fileUrl);
            } catch (IOException e) {
                // échec de sauvegarde du fichier — on continue sans lui
            }
        }

        return toMap(repository.save(s));
    }

    @Transactional
    public Map<String, Object> prendreEnCharge(Long id) {
        Signalement s = find(id);
        s.setStatut(StatutSignalement.EN_COURS);
        return toMap(repository.save(s));
    }

    @Transactional
    public Map<String, Object> resoudre(Long id) {
        Signalement s = find(id);
        s.setStatut(StatutSignalement.RESOLU);
        return toMap(repository.save(s));
    }

    @Transactional
    public Map<String, Object> repondre(Long id, String reponse) {
        Signalement s = find(id);
        s.setReponseAdmin(reponse != null ? reponse : "");
        s.setStatut(StatutSignalement.RESOLU);
        return toMap(repository.save(s));
    }

    @Transactional
    public Map<String, Object> repondreSuperviseur(Long id, String reponse) {
        Signalement s = find(id);
        s.setReponseSuperviseur(reponse != null ? reponse : "");
        s.setStatut(StatutSignalement.RESOLU);
        Map<String, Object> result = toMap(repository.save(s));
        if (s.getCreatedBy() != null) {
            try {
                notificationService.creer(
                    s.getCreatedBy(),
                    "💬 Réponse à votre signalement #" + s.getId(),
                    "Le superviseur a répondu à votre signalement \"" + s.getSujet() + "\" : " + reponse,
                    "SIGNALEMENT_REPONSE"
                );
            } catch (Exception ignored) {}
        }
        return result;
    }

    @Transactional
    public Map<String, Object> escalader(Long id, String note) {
        Signalement s = find(id);
        s.setStatut(StatutSignalement.ESCALADE);
        s.setNoteEscalade(note != null ? note : "Escaladé à l'administrateur.");
        return toMap(repository.save(s));
    }

    private Signalement find(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Signalement introuvable"));
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
    }

    private String saveFile(MultipartFile file) throws IOException {
        // Images and PDF only; random file name, extension + file signature checked
        String filename = com.cuteness.backend.security.SafeFileStorage.store(
                file, Paths.get(UPLOAD_DIR), com.cuteness.backend.security.SafeFileStorage.IMAGE_AND_PDF_EXTENSIONS);
        return "/uploads/signalements/" + filename;
    }

    private Map<String, Object> toMap(Signalement s) {
        Map<String, Object> m = new HashMap<>();
        m.put("id",           s.getId());
        m.put("type",         s.getType() != null ? s.getType().name() : "");
        m.put("sujet",        s.getSujet() != null ? s.getSujet() : "");
        m.put("description",  s.getDescription() != null ? s.getDescription() : "");
        m.put("priorite",     s.getPriorite() != null ? s.getPriorite().name() : "MOYENNE");
        m.put("statut",       s.getStatut() != null ? s.getStatut().name() : "ENVOYE");
        m.put("source",       s.getSource() != null ? s.getSource().name() : "CLIENT");
        m.put("auteur",       s.getAuteur() != null ? s.getAuteur() :
                              (s.getCreatedBy() != null ? s.getCreatedBy().getNom() : ""));
        m.put("date",         s.getDateCreation() != null ? s.getDateCreation().toString() : "");
        m.put("noteEscalade",         s.getNoteEscalade()         != null ? s.getNoteEscalade()         : "");
        m.put("reponseAdmin",         s.getReponseAdmin()         != null ? s.getReponseAdmin()         : "");
        m.put("reponseSuperviseur",   s.getReponseSuperviseur()   != null ? s.getReponseSuperviseur()   : "");
        m.put("fileUrl",              s.getFileUrl()              != null ? s.getFileUrl()              : "");
        return m;
    }
}
