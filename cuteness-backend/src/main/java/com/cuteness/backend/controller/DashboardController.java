package com.cuteness.backend.controller;

import com.cuteness.backend.dto.ConfirmerVirementRequest;
import com.cuteness.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    // Partner dashboard
    @GetMapping("/partenaire")
    @PreAuthorize("hasRole('PARTENAIRE')")
    public ResponseEntity<Map<String, Object>> getPartnerDashboard(
            Authentication authentication) {
        return ResponseEntity.ok(
                dashboardService.getPartnerDashboard(authentication.getName()));
    }

    // Admin dashboard
    @GetMapping("/admin")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISEUR')")
    public ResponseEntity<Map<String, Object>> getAdminDashboard() {
        return ResponseEntity.ok(dashboardService.getAdminDashboard());
    }

    // Comptable dashboard
    @GetMapping("/comptable")
    @PreAuthorize("hasAnyRole('COMPTABLE', 'ADMIN', 'SUPERVISEUR')")
    public ResponseEntity<Map<String, Object>> getComptableDashboard() {
        return ResponseEntity.ok(dashboardService.getComptableDashboard());
    }

    // Network tree - uses full tree for accountant/admin/superviseur, personal tree for partners
    @GetMapping("/reseau")
    public ResponseEntity<Map<String, Object>> getReseau(
            Authentication authentication) {
        boolean canSeeFullTree = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")
                        || a.getAuthority().equals("ROLE_COMPTABLE")
                        || a.getAuthority().equals("ROLE_SUPERVISEUR"));
        
        if (canSeeFullTree) {
            return ResponseEntity.ok(
                    dashboardService.getFullNetworkTree());
        } else {
            return ResponseEntity.ok(
                    dashboardService.getNetworkTree(authentication.getName()));
        }
    }

    // Mes virements (partenaire)
    @GetMapping("/mes-virements")
    @PreAuthorize("hasRole('PARTENAIRE')")
    public ResponseEntity<List<Map<String, Object>>> getMesVirements(Authentication authentication) {
        return ResponseEntity.ok(dashboardService.getMesVirements(authentication.getName()));
    }

    // Full network tree - explicit endpoint for accountant
    @GetMapping("/reseau/full")
    @PreAuthorize("hasAnyRole('COMPTABLE', 'ADMIN', 'SUPERVISEUR')")
    public ResponseEntity<Map<String, Object>> getFullReseau() {
        return ResponseEntity.ok(dashboardService.getFullNetworkTree());
    }

    // Confirm virement
    @PostMapping("/virement/confirmer")
    @PreAuthorize("hasAnyRole('COMPTABLE', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> confirmerVirement(
            @jakarta.validation.Valid @RequestBody ConfirmerVirementRequest request) {
        if (request.getMontant() <= 0) {
            throw new IllegalArgumentException("Le montant du virement doit être strictement positif");
        }
        return ResponseEntity.ok(
                dashboardService.confirmerVirement(
                        request.getPartenaireId(),
                        request.getMontant(),
                        request.getInfoBancaire(),
                        request.getTypePayment(),
                        request.getSemaine()));
    }

    // Validate commission (admin → VALIDEE_ADMIN, no credit)
    @PostMapping("/commission/valider/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> validerCommission(@PathVariable int id) {
        return ResponseEntity.ok(dashboardService.validerCommission(id));
    }

    // Batch approve all EN_ATTENTE commissions (admin)
    @PostMapping("/commission/valider-tout")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> validerToutAdmin() {
        return ResponseEntity.ok(dashboardService.validerToutAdmin());
    }

    // Pay commission (comptable → VALIDEE + credit solde)
    @PostMapping("/commission/payer/{id}")
    @PreAuthorize("hasAnyRole('COMPTABLE', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> payerCommission(@PathVariable int id) {
        return ResponseEntity.ok(dashboardService.payerCommission(id));
    }

    // Refuse commission
    @PostMapping("/commission/refuser/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> refuserCommission(@PathVariable int id) {
        return ResponseEntity.ok(dashboardService.refuserCommission(id));
    }

    // Delete commission
    @DeleteMapping("/commission/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'COMPTABLE')")
    public ResponseEntity<Void> supprimerCommission(@PathVariable int id) {
        dashboardService.supprimerCommission(id);
        return ResponseEntity.ok().build();
    }

    // Comptes en attente d'approbation (admin)
    @GetMapping("/comptes/en-attente")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getComptesEnAttente() {
        return ResponseEntity.ok(dashboardService.getComptesEnAttente());
    }

    @PostMapping("/comptes/approuver/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> approuverCompte(@PathVariable int id) {
        return ResponseEntity.ok(dashboardService.approuverCompte(id));
    }

    @PostMapping("/comptes/rejeter/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> rejeterCompte(@PathVariable int id) {
        return ResponseEntity.ok(dashboardService.rejeterCompte(id));
    }

    // Inscriptions (toutes — admin)
    @GetMapping("/inscriptions")
    @PreAuthorize("hasAnyRole('ADMIN', 'COMPTABLE')")
    public ResponseEntity<List<Map<String, Object>>> getInscriptions() {
        return ResponseEntity.ok(dashboardService.getInscriptions());
    }

    // Inscriptions traitées à livrer (comptable)
    @GetMapping("/inscriptions/traitees")
    @PreAuthorize("hasAnyRole('ADMIN', 'COMPTABLE')")
    public ResponseEntity<List<Map<String, Object>>> getInscriptionsTraitees() {
        return ResponseEntity.ok(dashboardService.getInscriptionsTraitees());
    }

    // Liste des partenaires pour le superviseur (création commande)
    @GetMapping("/partenaires")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISEUR')")
    public ResponseEntity<List<Map<String, Object>>> getPartenaires() {
        return ResponseEntity.ok(dashboardService.getPartenaires());
    }

    // Notifications
    @GetMapping("/notifications")
    public ResponseEntity<?> getNotifications(Authentication authentication) {
        return ResponseEntity.ok(dashboardService.getNotifications(authentication.getName()));
    }

    @GetMapping("/notifications/count")
    public ResponseEntity<Map<String, Object>> countNotifications(Authentication authentication) {
        long count = dashboardService.countNotificationsNonLues(authentication.getName());
        return ResponseEntity.ok(Map.of("nonLues", count));
    }

    @PostMapping("/notifications/marquer-lues")
    public ResponseEntity<Void> marquerNotificationsLues(Authentication authentication) {
        dashboardService.marquerNotificationsLues(authentication.getName());
        return ResponseEntity.ok().build();
    }
}
