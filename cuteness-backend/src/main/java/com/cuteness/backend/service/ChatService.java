package com.cuteness.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class ChatService {

    private static final int MAX_PER_HOUR = 15;
    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    private static final String SYSTEM_PROMPT = """
            You are the virtual assistant of Cuteness Collaboration, an MLM (multi-level marketing) platform
            specialised in beauty products, cosmetics, perfumes and watches in Tunisia.

            You help visitors understand:
            - Membership packs: Starter (99 DT), Silver (249 DT), Gold (499 DT)
            - Available products: cosmetics, perfumes, watches, mix
            - The commission system:
              * Starter: 5% direct commission
              * Silver: 10% level 1 + 3% level 2
              * Gold: 15% level 1 + 5% level 2 + 2% level 3
            - Training courses available on the platform to develop skills
            - How to become a partner: register, choose a pack, get a referral code
            - Order tracking and delivery via Navex
            - The online shop: buy and resell products
            - MLM advantages: build a network, earn commissions at multiple levels

            LANGUAGE RULES (strictly follow these):
            - Detect the language of the user's message and ALWAYS reply in that EXACT same language
            - Supported languages: English, French (français), Arabic (العربية), Tunisian dialect (الدارجة / derja)
            - If the user writes in English → reply in English
            - If the user writes in French → reply in French
            - If the user writes in Tunisian darija (ex: "chneya", "kifeh", "bech", "3andek") → reply in darija
            - If the user writes in standard or modern Arabic → reply in Arabic
            - Never switch language unless the user explicitly requests it
            - Be clear, concise and professional in all languages
            - If the user asks something unrelated to Cuteness, politely redirect the conversation
            - For technical or urgent issues, invite them to contact support: amalcuteness2002@gmail.com
            """;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ConcurrentHashMap<String, List<Long>> rateLimitMap = new ConcurrentHashMap<>();

    @Value("${gemini.api-key}")
    private String apiKey;

    private String buildContextualPrompt(Map<String, Object> ctx) {
        StringBuilder sb = new StringBuilder();
        sb.append("DONNEES PERSONNELLES DU PARTENAIRE CONNECTE (utilise-les pour répondre à ses questions personnelles) :\n");
        append(sb, ctx, "nom",                 "Nom");
        append(sb, ctx, "pack",                "Pack actuel");
        append(sb, ctx, "solde",               "Solde (DT)");
        append(sb, ctx, "commissionsTotal",    "Total commissions gagnées (DT)");
        append(sb, ctx, "commissionsEnAttente","Commissions en attente (nb)");
        append(sb, ctx, "commandesTotal",      "Nombre total de commandes");
        append(sb, ctx, "commandesEnAttente",  "Commandes en attente (nb)");
        append(sb, ctx, "filleulsTotal",       "Réseau total (filleuls)");
        append(sb, ctx, "filleulsDirects",     "Filleuls directs");
        append(sb, ctx, "tauxCommission",      "Taux de commission (%)");
        append(sb, ctx, "tauxReduction",       "Taux de réduction boutique (%)");
        append(sb, ctx, "grade",               "Grade actuel");
        append(sb, ctx, "pointsTotal",         "Points totaux");
        append(sb, ctx, "virementsEnAttente",  "Virements en attente (nb)");
        append(sb, ctx, "virementsTotalRecu",  "Total virements reçus (DT)");
        append(sb, ctx, "dateInscription",     "Date d'inscription");
        append(sb, ctx, "region",              "Région");
        append(sb, ctx, "codeParrainage",      "Code de parrainage");
        sb.append("\nRéponds aux questions personnelles (solde, réseau, commissions, etc.) en utilisant ces données réelles.");
        return sb.toString();
    }

    private void append(StringBuilder sb, Map<String, Object> ctx, String key, String label) {
        if (ctx.containsKey(key) && ctx.get(key) != null) {
            sb.append("- ").append(label).append(" : ").append(ctx.get(key)).append("\n");
        }
    }

    /** Retourne true si la requête est autorisée, false en cas de limitation de débit. */
    public boolean checkAndRecord(String ip) {
        long now = System.currentTimeMillis();
        long cutoff = now - 3_600_000L;
        List<Long> slots = rateLimitMap.computeIfAbsent(ip, k -> Collections.synchronizedList(new ArrayList<>()));
        synchronized (slots) {
            slots.removeIf(t -> t < cutoff);
            if (slots.size() >= MAX_PER_HOUR) return false;
            slots.add(now);
            return true;
        }
    }

    public String chat(String userMessage, Map<String, Object> context) {
        String systemPrompt = context != null && !context.isEmpty()
                ? buildContextualPrompt(context) + "\n\n" + SYSTEM_PROMPT
                : SYSTEM_PROMPT;
        try {
            Map<String, Object> requestBody = Map.of(
                    "system_instruction", Map.of(
                            "parts", List.of(Map.of("text", systemPrompt))
                    ),
                    "contents", List.of(
                            Map.of("role", "user", "parts", List.of(Map.of("text", userMessage)))
                    ),
                    "generationConfig", Map.of(
                            "maxOutputTokens", 500,
                            "temperature", 0.7
                    )
            );

            String jsonBody = objectMapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(GEMINI_URL + "?key=" + apiKey))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            log.info("Gemini status: {}", response.statusCode());

            if (response.statusCode() != 200) {
                log.error("Gemini error body: {}", response.body());
                return "Je rencontre un problème technique. Veuillez contacter le support : amalcuteness2002@gmail.com";
            }

            JsonNode root = objectMapper.readTree(response.body());
            return root.at("/candidates/0/content/parts/0/text").asText(
                    "Je n'ai pas pu générer une réponse. Veuillez réessayer."
            );

        } catch (Exception e) {
            log.error("Gemini call failed: {}", e.getMessage(), e);
            return "Une erreur est survenue. Veuillez contacter le support : amalcuteness2002@gmail.com";
        }
    }
}
