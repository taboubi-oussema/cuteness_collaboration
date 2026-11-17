package com.cuteness.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Set;

@Service
@Slf4j
public class NavexService {

    @Value("${navex.post-url:https://app.navex.tn/api/cutenesstn-21UU803NBAOM6LY9AAD9Q35A7RM2WQMF/v1/post.php}")
    private String postUrl;

    @Value("${navex.get-url:https://app.navex.tn/api/cutenesstn-etat-21UU803NBAOM6LY9AAD9Q35A7RM2WQMF/v1/get.php}")
    private String getUrl;

    @Value("${navex.tracking-url:https://app.navex.tn/expediteur/suivi.php?code=}")
    private String trackingUrlBase;

    private static final Set<String> LIVRE_STATUTS = Set.of("Livrés", "Livrés payés");
    private static final Set<String> RETOUR_STATUTS = Set.of(
        "Retour définitif", "Retour Inter-agence", "Retour Expéditeurs",
        "Retour reçu", "Retour dépôt", "Remboursés"
    );

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Creates a colis on Navex and returns the tracking reference.
     * Returns null if the call fails (caller should handle gracefully).
     */
    public String creerColis(String nom, String gouvernerat, String ville,
                              String tel, String designation, String prix) {
        return creerColis(nom, gouvernerat, ville, tel, designation, prix, "", "1");
    }

    public String creerColis(String nom, String gouvernerat, String ville,
                              String tel, String designation, String prix,
                              String adresse, String nbArticle) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("prix",            prix != null ? prix : "0");
            body.add("nom",             nom != null ? nom : "");
            body.add("gouvernerat",     gouvernerat != null ? gouvernerat : "Tunis");
            body.add("ville",           ville != null ? ville : (gouvernerat != null ? gouvernerat : "Tunis"));
            body.add("adresse",         adresse != null ? adresse : "");
            body.add("tel",             tel != null ? tel : "");
            body.add("tel2",            "");
            body.add("designation",     designation != null ? designation : "Pack Cuteness");
            body.add("nb_article",      nbArticle != null ? nbArticle : "1");
            body.add("msg",             "");
            body.add("echange",         "Non");
            body.add("article",         "");
            body.add("nb_echange",      "0");
            body.add("ouvrir",          "Non");
            body.add("sender_name",     "Cuteness Collaboration");
            body.add("sender_location", "Tunis");

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(postUrl, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<?, ?> resp = response.getBody();
                log.info("Navex response: {}", resp);

                // Extract tracking ref from colis object
                Object colis = resp.get("colis");
                if (colis instanceof Map) {
                    Map<?, ?> colisMap = (Map<?, ?>) colis;
                    for (String key : new String[]{"ref", "barcode", "id", "code", "tracking"}) {
                        Object val = colisMap.get(key);
                        if (val != null && !val.toString().isBlank()) return val.toString();
                    }
                    // If colis exists but no known key, return first value
                    if (!colisMap.isEmpty()) return colisMap.values().iterator().next().toString();
                }
                // Fallback: return status message if colis not present
                Object msg = resp.get("status_message");
                return msg != null ? "NAVEX-OK:" + msg : "NAVEX-OK";
            }
        } catch (Exception e) {
            log.error("Navex API error for '{}': {}", nom, e.getMessage());
        }
        return null;
    }

    /**
     * Queries Navex for the current delivery status of a colis.
     * Returns the "etat" string (e.g. "Livrés", "En cours") or null on failure.
     */
    public String getEtat(String navexRef) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("ref", navexRef);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(getUrl, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<?, ?> resp = response.getBody();
                log.info("Navex getEtat [{}]: {}", navexRef, resp);
                Object etat = resp.get("etat");
                if (etat != null && !etat.toString().isBlank()) return etat.toString();
                // fallback keys
                for (String key : new String[]{"statut", "status", "state"}) {
                    Object val = resp.get(key);
                    if (val != null && !val.toString().isBlank()) return val.toString();
                }
            }
        } catch (Exception e) {
            log.error("Navex getEtat error [{}]: {}", navexRef, e.getMessage());
        }
        return null;
    }

    public boolean isLivre(String etat) {
        if (etat == null) return false;
        return LIVRE_STATUTS.stream().anyMatch(s -> s.equalsIgnoreCase(etat.trim()));
    }

    public boolean isRetour(String etat) {
        if (etat == null) return false;
        return RETOUR_STATUTS.stream().anyMatch(s -> s.equalsIgnoreCase(etat.trim()));
    }

    public String trackingUrl(String navexRef) {
        return trackingUrlBase + navexRef;
    }
}
