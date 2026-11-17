package com.cuteness.backend.controller;

import com.cuteness.backend.dto.*;
import com.cuteness.backend.enums.StatutCommande;
import com.cuteness.backend.service.CommandeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/commandes")
@RequiredArgsConstructor
public class CommandeController {

    private final CommandeService commandeService;

    // POST — superviseur ou partenaire passe une commande
    @PostMapping
    @PreAuthorize("hasAnyRole('PARTENAIRE', 'ADMIN', 'SUPERVISEUR')")
    public ResponseEntity<CommandeResponse> passerCommande(
            @RequestBody CommandeRequest request,
            Authentication authentication) {
        boolean isSuperviseur = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPERVISEUR"));
        String email = (isSuperviseur && request.getPartenaireEmail() != null && !request.getPartenaireEmail().isBlank())
                ? request.getPartenaireEmail()
                : authentication.getName();
        return ResponseEntity.ok(commandeService.passerCommande(request, email));
    }

    // GET — partenaire sees his own orders
    @GetMapping("/mes-commandes")
    @PreAuthorize("hasAnyRole('PARTENAIRE', 'ADMIN')")
    public ResponseEntity<List<CommandeResponse>> getMesCommandes(
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(commandeService.getMesCommandes(email));
    }

    // GET all — admin sees all orders
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISEUR', 'COMPTABLE')")
    public ResponseEntity<List<CommandeResponse>> getAllCommandes() {
        return ResponseEntity.ok(commandeService.getAllCommandes());
    }

    // PATCH — update order status (body: {"statut":"EN_PREPARATION"})
    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISEUR')")
    public ResponseEntity<CommandeResponse> updateStatut(
            @PathVariable int id,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        StatutCommande statut = StatutCommande.valueOf(body.get("statut"));
        return ResponseEntity.ok(commandeService.updateStatut(id, statut, authentication.getName()));
    }

    // POST — comptable approves remboursement credit
    @PostMapping("/{id}/approuver-remboursement")
    @PreAuthorize("hasAnyRole('ADMIN', 'COMPTABLE')")
    public ResponseEntity<CommandeResponse> approuverRemboursement(@PathVariable int id) {
        return ResponseEntity.ok(commandeService.approuverRemboursement(id));
    }

    // POST — superviseur crée automatiquement un colis Navex pour la commande
    @PostMapping("/{id}/colis-navex")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISEUR')")
    public ResponseEntity<CommandeResponse> creerColisNavex(@PathVariable int id) {
        return ResponseEntity.ok(commandeService.creerColisNavexCommande(id));
    }

    // POST — superviseur traite la commande + associe le code Navex
    @PostMapping("/{id}/traiter")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISEUR')")
    public ResponseEntity<CommandeResponse> traiter(
            @PathVariable int id,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        return ResponseEntity.ok(commandeService.traiterCommande(id, body.get("navexRef"), authentication.getName()));
    }

    // GET — commandes en attente de confirmation comptable (Navex livré/retourné)
    @GetMapping("/a-confirmer")
    @PreAuthorize("hasAnyRole('ADMIN', 'COMPTABLE')")
    public ResponseEntity<List<CommandeResponse>> getAConfirmer() {
        return ResponseEntity.ok(commandeService.getCommandesAConfirmer());
    }

    // POST — comptable confirme livraison ou retour Navex
    @PostMapping("/{id}/confirmer")
    @PreAuthorize("hasAnyRole('ADMIN', 'COMPTABLE')")
    public ResponseEntity<CommandeResponse> confirmer(@PathVariable int id) {
        return ResponseEntity.ok(commandeService.confirmer(id));
    }

    // POST — marquer manuellement comme livré + rembourser si REMBOURSEMENT
    @PostMapping("/{id}/marquer-livre")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISEUR', 'COMPTABLE')")
    public ResponseEntity<CommandeResponse> marquerLivre(@PathVariable int id) {
        return ResponseEntity.ok(commandeService.marquerLivre(id));
    }

    // POST — marquer en retour + débit 5 DT sur le solde du partenaire
    @PostMapping("/{id}/marquer-retour")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISEUR', 'COMPTABLE')")
    public ResponseEntity<CommandeResponse> marquerRetour(@PathVariable int id) {
        return ResponseEntity.ok(commandeService.marquerRetour(id));
    }

    // DELETE — comptable ou admin supprime une commande
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'COMPTABLE')")
    public ResponseEntity<Void> supprimer(@PathVariable int id) {
        commandeService.supprimerCommande(id);
        return ResponseEntity.noContent().build();
    }

    // POST — admin: force-attribue les points gamification pour une commande LIVREE existante
    @PostMapping("/{id}/retrigger-points")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> retriggerPoints(@PathVariable int id) {
        return ResponseEntity.ok(commandeService.retriggerGamificationPoints(id));
    }
}
