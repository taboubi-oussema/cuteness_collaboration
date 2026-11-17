package com.cuteness.backend.service;

import com.cuteness.backend.entity.Commande;
import com.cuteness.backend.entity.DemandeInscription;
import com.cuteness.backend.entity.User;
import com.cuteness.backend.entity.Transaction;
import com.cuteness.backend.entity.Virement;
import com.cuteness.backend.enums.RewardType;
import com.cuteness.backend.enums.Role;
import com.cuteness.backend.enums.TypeTransaction;
import com.cuteness.backend.enums.StatutCommande;
import com.cuteness.backend.enums.StatutSignalement;
import com.cuteness.backend.enums.StatutVirement;
import com.cuteness.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

        private final UserRepository userRepository;
        private final CommandeRepository commandeRepository;
        private final TransactionRepository transactionRepository;
        private final VirementRepository virementRepository;
        private final SignalementRepository signalementRepository;
        private final NotificationService notificationService;
        private final DemandeInscriptionService demandeInscriptionService;
        private final DemandeInscriptionRepository demandeInscriptionRepository;
        private final PartnerRewardRepository partnerRewardRepository;

        
        public Map<String, Object> getPartnerDashboard(String email) {
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

                long filleulsDirects = userRepository.countByParrain(user);
                long reseauTotal = countNetworkSize(user);

                double totalCommissions = transactionRepository.findByUser(user)
                                .stream()
                                .filter(t -> t.getType() == TypeTransaction.COMMISSION)
                                .mapToDouble(t -> t.getMontant()).sum();

                double totalAchats = transactionRepository.findByUser(user)
                                .stream()
                                .filter(t -> t.getType() == TypeTransaction.ACHAT)
                                .mapToDouble(t -> t.getMontant()).sum();

                double totalCredits = transactionRepository.findByUser(user)
                                .stream()
                                .filter(t -> t.getType() == TypeTransaction.CREDIT)
                                .mapToDouble(t -> t.getMontant()).sum();

                long totalCommandes = commandeRepository.findByPartenaire(user).size();

                Map<String, Object> dashboard = new LinkedHashMap<>();
                dashboard.put("id", user.getId());
                dashboard.put("nom", user.getNom());
                dashboard.put("email", user.getEmail());
                dashboard.put("telephone", user.getTelephone());
                dashboard.put("region", user.getRegion());
                dashboard.put("codeParrainage", user.getCodeParrainage());
                dashboard.put("statut", user.isStatut());
                dashboard.put("dateCreation", user.getDateCreation());
                dashboard.put("soldeInterne", round(user.getSoldeInterne() != null ? user.getSoldeInterne() : 0.0));
                double packReduction = user.getTauxReduction() != null ? user.getTauxReduction() : 0.0;
                double rewardReduction = partnerRewardRepository
                        .findActiveByPartenaireAndType(user, RewardType.REDUCTION_POURCENT, LocalDate.now())
                        .stream().mapToDouble(r -> r.getValeur()).sum();
                dashboard.put("tauxReduction", packReduction + rewardReduction);
                dashboard.put("monPack", user.getPack() != null ? user.getPack().getNom() : "Aucun");
                dashboard.put("tauxCommission", user.getPack() != null ? user.getPack().getTauxCommissionDirect() : 0);
                dashboard.put("niveaux", user.getPack() != null ? user.getPack().getNiveaux() : 1);
                dashboard.put("parrain", user.getParrain() != null ? user.getParrain().getNom() : null);
                dashboard.put("filleulsDirects", filleulsDirects);
                dashboard.put("reseauTotal", reseauTotal);
                dashboard.put("totalCommissions", round(totalCommissions));
                dashboard.put("totalAchats", round(totalAchats));
                dashboard.put("totalCredits", round(totalCredits));
                dashboard.put("totalCommandes", totalCommandes);
                dashboard.put("transactions", getRecentTransactions(user));
                dashboard.put("commissions", getCommissions(user));
                dashboard.put("reseau", getNetworkTree(user));

                return dashboard;
        }

        
        public Map<String, Object> getAdminDashboard() {
                long totalPartenaires = userRepository.countByRole(Role.PARTENAIRE);

                double totalCommissions = transactionRepository.findAll()
                                .stream()
                                .filter(t -> t.getType() == TypeTransaction.COMMISSION)
                                .mapToDouble(t -> t.getMontant()).sum();

                double chiffreAffaires = transactionRepository.findAll()
                                .stream()
                                .filter(t -> t.getType() == TypeTransaction.ACHAT)
                                .mapToDouble(t -> t.getMontant()).sum();

                long totalCommandes = commandeRepository.count();

                List<Map<String, Object>> topPartenaires = userRepository.findAll()
                                .stream()
                                .filter(u -> u.getRole() == Role.PARTENAIRE)
                                .sorted((a, b) -> Double.compare(
                                                b.getSoldeInterne() != null ? b.getSoldeInterne() : 0.0,
                                                a.getSoldeInterne() != null ? a.getSoldeInterne() : 0.0))
                                .limit(5)
                                .map(this::mapPartenaire)
                                .collect(Collectors.toList());

                Map<String, Long> mlmParPack = userRepository.findAll()
                                .stream()
                                .filter(u -> u.getRole() == Role.PARTENAIRE && u.isStatut() && u.getPack() != null)
                                .collect(Collectors.groupingBy(u -> u.getPack().getNom(), Collectors.counting()));

                List<Map<String, Object>> activiteRecente = transactionRepository.findAll()
                                .stream()
                                .sorted((a, b) -> {
                                        if (b.getDate() == null) return 1;
                                        if (a.getDate() == null) return -1;
                                        return b.getDate().compareTo(a.getDate());
                                })
                                .limit(5)
                                .map(t -> {
                                        Map<String, Object> act = new LinkedHashMap<>();
                                        act.put("type", t.getType().toString());
                                        act.put("montant", round(t.getMontant()));
                                        act.put("partenaire", t.getUser() != null ? t.getUser().getNom() : "Inconnu");
                                        act.put("date", t.getDate() != null ? t.getDate().toString() : null);
                                        return act;
                                })
                                .collect(Collectors.toList());

                long commandesEnAttente = commandeRepository.findAll()
                                .stream()
                                .filter(c -> c.getStatut() == StatutCommande.EN_ATTENTE)
                                .count();

                long commissionsEnAttente = transactionRepository.findAll()
                                .stream()
                                .filter(t -> t.getType() == TypeTransaction.COMMISSION
                                                && "EN_ATTENTE".equals(t.getStatut()))
                                .count();

                long transactionsTotal = transactionRepository.count();

                long signalementsOuverts = signalementRepository.findByStatutNot(StatutSignalement.RESOLU).size();

                int currentMonth = java.time.LocalDateTime.now().getMonthValue();
                int currentYear  = java.time.LocalDateTime.now().getYear();
                long newThisMonth = userRepository.findAll()
                                .stream()
                                .filter(u -> u.getRole() == Role.PARTENAIRE && u.getDateCreation() != null)
                                .filter(u -> u.getDateCreation().getMonthValue() == currentMonth
                                          && u.getDateCreation().getYear() == currentYear)
                                .count();

                Map<String, Object> dashboard = new LinkedHashMap<>();
                dashboard.put("totalPartenaires", totalPartenaires);
                dashboard.put("totalCommissions", Math.round(totalCommissions * 100.0) / 100.0);
                dashboard.put("chiffreAffaires", Math.round(chiffreAffaires * 100.0) / 100.0);
                dashboard.put("totalCommandes", totalCommandes);
                dashboard.put("topPartenaires", topPartenaires);
                dashboard.put("mlmParPack", mlmParPack);
                dashboard.put("activiteRecente", activiteRecente);
                dashboard.put("commandesEnAttente", commandesEnAttente);
                dashboard.put("commissionsEnAttente", commissionsEnAttente);
                dashboard.put("transactionsTotal", transactionsTotal);
                dashboard.put("signalementsOuverts", signalementsOuverts);
                dashboard.put("newThisMonth", newThisMonth);

                return dashboard;
        }

        
        public Map<String, Object> getComptableDashboard() {
                List<User> partenaires = userRepository.findAll()
                                .stream()
                                .filter(u -> u.getRole() == Role.PARTENAIRE)
                                .collect(Collectors.toList());

                List<Transaction> transactions = transactionRepository.findAll()
                                .stream()
                                .sorted((a, b) -> b.getDate().compareTo(a.getDate()))
                                .collect(Collectors.toList());

                List<Transaction> commissions = transactions.stream()
                                .filter(t -> t.getType() == TypeTransaction.COMMISSION)
                                .collect(Collectors.toList());

                List<Commande> commandes = commandeRepository.findAll()
                                .stream()
                                .filter(c -> c.getDateCommande() != null)
                                .sorted((a, b) -> b.getDateCommande().compareTo(a.getDateCommande()))
                                .collect(Collectors.toList());

                List<Virement> virements = virementRepository.findAll()
                                .stream()
                                .sorted((a, b) -> b.getDateVirement().compareTo(a.getDateVirement()))
                                .collect(Collectors.toList());

                double totalCommissions = commissions.stream()
                                .filter(t -> "VALIDEE".equals(t.getStatut()))
                                .mapToDouble(Transaction::getMontant).sum();
                double totalAchats = commandes.stream()
                                .mapToDouble(c -> c.getMontantTotal() != null ? c.getMontantTotal() : 0.0).sum();
                double totalAVirer = partenaires.stream()
                                .mapToDouble(p -> p.getSoldeInterne() != null ? p.getSoldeInterne() : 0.0)
                                .sum();

                long commissionsAValider = commissions.stream()
                                .filter(t -> "EN_ATTENTE".equals(t.getStatut()))
                                .count();

                Map<String, Object> dashboard = new LinkedHashMap<>();
                dashboard.put("kpis", Map.of(
                                "totalCommissionsValidees", round(totalCommissions),
                                "totalTransactions", transactions.size(),
                                "totalTransactionsPacks", round(totalAchats),
                                "totalTransactionsBoutique", 0.0,
                                "commissionsAValider", commissionsAValider,
                                "totalPartenaires", partenaires.size(),
                                "revenusMonth", round(totalAchats),
                                "totalAVirer", round(totalAVirer),
                                "virementsSemaine", virements.stream().filter(v -> v.getSemaine() != null && v.getSemaine().contains("S")).count()));
                dashboard.put("commissions",
                                commissions.stream().limit(200).map(this::mapCommission).collect(Collectors.toList()));
                dashboard.put("transactions",
                                commandes.stream().limit(200).map(this::mapCommande).collect(Collectors.toList()));
                dashboard.put("partenaires",
                                partenaires.stream().map(this::mapPartenaire).collect(Collectors.toList()));
                dashboard.put("virements", virements.stream().map(this::mapVirement).collect(Collectors.toList()));

                return dashboard;
        }

        
        public Map<String, Object> getNetworkTree(String email) {
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
                return getNetworkTree(user);
        }

        public Map<String, Object> getNetworkTree(User user) {
                Map<String, Object> node = new LinkedHashMap<>();
                node.put("id", user.getId());
                node.put("nom", user.getNom());
                node.put("pack", user.getPack() != null ? user.getPack().getNom() : "Aucun");
                node.put("solde", user.getSoldeInterne());
                node.put("actif", user.isStatut());

                List<User> children = userRepository.findByParrain(user);
                if (!children.isEmpty()) {
                        node.put("filleuls", children.stream()
                                        .map(this::getNetworkTree)
                                        .collect(Collectors.toList()));
                }
                return node;
        }

        
        @Transactional(readOnly = true)
        public Map<String, Object> getFullNetworkTree() {
                // Utilise une requête JPQL pour éviter le lazy-loading du parrain en dehors d'une session
                List<User> roots = userRepository.findByParrainIsNullAndRole(Role.PARTENAIRE);

                // Si aucun partenaire racine, créer une racine virtuelle
                Map<String, Object> rootNode = new LinkedHashMap<>();
                rootNode.put("id", 0);
                rootNode.put("nom", "Cuteness Collaboration");
                rootNode.put("pack", "ADMIN");
                rootNode.put("solde", 0.0);
                rootNode.put("actif", true);
                rootNode.put("niveau", 0);

                        // Ajouter tous les partenaires sans sponsor comme enfants de la racine
                if (!roots.isEmpty()) {
                        rootNode.put("filleuls", roots.stream()
                                        .map(this::getNetworkTree)
                                        .collect(Collectors.toList()));
                } else {
                        // Aucune racine trouvée — afficher tous les partenaires à plat
                        rootNode.put("filleuls", userRepository.findByRole(Role.PARTENAIRE).stream()
                                        .map(this::getNetworkTree)
                                        .collect(Collectors.toList()));
                }

                return rootNode;
        }

        
        private List<Map<String, Object>> getRecentTransactions(User user) {
                return transactionRepository.findByUser(user)
                                .stream()
                                .sorted((a, b) -> b.getDate().compareTo(a.getDate()))
                                .limit(10)
                                .map(t -> {
                                        Map<String, Object> map = new LinkedHashMap<>();
                                        map.put("type", t.getType().toString());
                                        map.put("montant", round(t.getMontant()));
                                        map.put("statut", t.getStatut() != null ? t.getStatut() : "VALIDEE");
                                        map.put("source", t.getSourceLabel() != null ? t.getSourceLabel() : "");
                                        map.put("niveau", t.getNiveau() != null ? t.getNiveau() : 1);
                                        map.put("date", t.getDate() != null ? t.getDate().toString() : null);
                                        return map;
                                })
                                .collect(Collectors.toList());
        }

        
        private List<Map<String, Object>> getCommissions(User user) {
                return transactionRepository.findByUser(user)
                                .stream()
                                .filter(t -> t.getType() == TypeTransaction.COMMISSION)
                                .sorted((a, b) -> b.getDate().compareTo(a.getDate()))
                                .map(t -> {
                                        Map<String, Object> map = new LinkedHashMap<>();
                                        map.put("id", "C" + String.format("%03d", t.getId()));
                                        map.put("source", t.getSourceLabel() != null ? t.getSourceLabel() : "Réseau MLM");
                                        map.put("sourceUserNom", t.getSourceUserNom() != null ? t.getSourceUserNom() : "");
                                        map.put("montant", round(t.getMontant()));
                                        map.put("niveau", t.getNiveau() != null ? t.getNiveau() : 1);
                                        map.put("statut", t.getStatut() != null ? t.getStatut() : "EN_ATTENTE");
                                        map.put("date", t.getDate() != null ? t.getDate().toString() : null);
                                        return map;
                                })
                                .collect(Collectors.toList());
        }

        
        private long countNetworkSize(User user) {
                List<User> children = userRepository.findByParrain(user);
                long count = children.size();
                for (User child : children) {
                        count += countNetworkSize(child);
                }
                return count;
        }

        private Map<String, Object> mapCommission(Transaction t) {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", "C" + String.format("%03d", t.getId()));
                map.put("partenaire", t.getUser() != null ? t.getUser().getNom() : "Inconnu");
                map.put("source", t.getSourceLabel() != null ? t.getSourceLabel() : "Réseau");
                map.put("sourceUserNom", t.getSourceUserNom() != null ? t.getSourceUserNom() : "");
                map.put("montant", round(t.getMontant()));
                map.put("niveau", t.getNiveau() != null ? t.getNiveau() : 1);
                map.put("statut", t.getStatut() != null ? t.getStatut() : "EN_ATTENTE");
                map.put("date", t.getDate() != null ? t.getDate().toString() : null);
                map.put("pack",
                                t.getUser() != null && t.getUser().getPack() != null ? t.getUser().getPack().getNom()
                                                : "Aucun");
                return map;
        }

        private Map<String, Object> mapTransaction(Transaction t) {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", "T" + String.format("%03d", t.getId()));
                map.put("partenaire", t.getUser() != null ? t.getUser().getNom() : "Inconnu");
                map.put("type", "BOUTIQUE");
                String description = t.getSourceLabel() != null && !t.getSourceLabel().isBlank()
                        ? t.getSourceLabel() : "Achat partenaire";
                map.put("description", description);
                double montantOriginal = t.getMontantOriginal() != null && t.getMontantOriginal() > 0
                        ? t.getMontantOriginal() : t.getMontant();
                double reduction = t.getMontantReduction() != null ? t.getMontantReduction() : 0.0;
                map.put("montant",      round(montantOriginal));
                map.put("reduction",    round(reduction));
                map.put("montantFinal", round(t.getMontant()));
                map.put("statut", "PAYEE");
                map.put("date", t.getDate() != null ? t.getDate().toString() : null);
                return map;
        }

        private Map<String, Object> mapCommande(Commande c) {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", "CMD-" + String.format("%03d", c.getId()));
                map.put("partenaire", c.getPartenaire() != null ? c.getPartenaire().getNom() : "Inconnu");
                map.put("type", "BOUTIQUE");
                map.put("description", "CMD-" + String.format("%03d", c.getId()));
                double montantOriginal = c.getMontantOriginal() != null ? c.getMontantOriginal() : 0.0;
                double taux = c.getTauxReduction() != null ? c.getTauxReduction() : 0.0;
                // Utilise la réduction stockée si présente ; sinon dérive de tauxReduction (couvre REMBOURSEMENT et anciens enregistrements)
                double reduction = (c.getMontantReduction() != null && c.getMontantReduction() > 0)
                        ? c.getMontantReduction()
                        : Math.round(montantOriginal * (taux / 100.0) * 100.0) / 100.0;
                double montantFinal = c.getMontantTotal() != null ? c.getMontantTotal() : montantOriginal;
                map.put("montant",      round(montantOriginal));
                map.put("reduction",    round(reduction));
                map.put("montantFinal", round(montantFinal));
                map.put("statut",       c.getStatut() != null ? c.getStatut().toString() : "EN_ATTENTE");
                map.put("date",         c.getDateCommande());
                return map;
        }

        private Map<String, Object> mapPartenaire(User p) {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", "P" + String.format("%03d", p.getId()));
                map.put("userId", p.getId()); // Include the actual numeric ID
                map.put("nom", p.getNom());
                map.put("email", p.getEmail());
                map.put("pack", p.getPack() != null ? p.getPack().getNom() : "Aucun");
                map.put("solde", round(p.getSoldeInterne() != null ? p.getSoldeInterne() : 0.0));
                map.put("niveau", 1);
                map.put("actif", p.isStatut());
                map.put("typePayment", normalizePaymentType(p.getModePaiement()));
                map.put("infoBancaire", p.getInfoBancaire() != null ? p.getInfoBancaire() : "N/A");
                map.put("banque", p.getBanque() != null ? p.getBanque() : "");
                map.put("parrain", p.getParrain() != null ? p.getParrain().getNom() : null);
                map.put("filleuls", userRepository.countByParrain(p));
                map.put("totalGains", round(
                                transactionRepository.findByUser(p).stream()
                                                .filter(t -> t.getType() == TypeTransaction.COMMISSION)
                                                .mapToDouble(Transaction::getMontant)
                                                .sum()));
                return map;
        }

        private String normalizePaymentType(String modePaiement) {
                if (modePaiement == null)
                        return "RIB";
                String val = modePaiement.trim().toUpperCase(Locale.ROOT);
                if (val.contains("DINAR"))
                        return "EDINAR";
                if (val.contains("CARTE"))
                        return "CARTE";
                return "RIB";
        }

        private Map<String, Object> mapVirement(Virement v) {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", "V" + String.format("%03d", v.getId()));
                map.put("partenaire", v.getPartenaire() != null ? v.getPartenaire().getNom() : "Inconnu");
                map.put("montant", round(v.getMontant()));
                map.put("infoBancaire", v.getInfoBancaire() != null ? v.getInfoBancaire() : "N/A");
                map.put("typePayment", v.getTypePayment() != null ? v.getTypePayment() : "RIB");
                map.put("statut", v.getStatut().toString());
                map.put("date", v.getDateVirement() != null ? v.getDateVirement().toString() : null);
                map.put("semaine", v.getSemaine() != null ? v.getSemaine() : "");
                return map;
        }

        
        public List<Map<String, Object>> getMesVirements(String email) {
                User partenaire = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
                return virementRepository.findByPartenaireOrderByDateVirementDesc(partenaire)
                                .stream()
                                .map(this::mapVirement)
                                .collect(Collectors.toList());
        }

        
        @Transactional
        public Map<String, Object> confirmerVirement(int partenaireId, double montant, String infoBancaire,
                        String typePayment, String semaine) {
                if (montant <= 0) {
                        throw new IllegalArgumentException("Le montant du virement doit être strictement positif");
                }
                // Récupère le partenaire
                User partenaire = userRepository.findById(partenaireId)
                                .orElseThrow(() -> new RuntimeException("Partenaire introuvable"));

                // Crée et enregistre le virement
                Virement virement = Virement.builder()
                                .partenaire(partenaire)
                                .montant(montant)
                                .infoBancaire(infoBancaire)
                                .typePayment(typePayment)
                                .statut(StatutVirement.EFFECTUE)
                                .semaine(semaine)
                                .build();

                virement = virementRepository.save(virement);

                // Met à jour le solde du partenaire
                partenaire.setSoldeInterne(0.0);
                userRepository.save(partenaire);

                // Crée un enregistrement de transaction pour le suivi
                Transaction transaction = Transaction.builder()
                                .user(partenaire)
                                .type(TypeTransaction.CREDIT)
                                .montant(montant)
                                .build();
                transactionRepository.save(transaction);

                notificationService.notifierVirement(partenaire, montant);

                // Retourne la réponse
                Map<String, Object> response = new LinkedHashMap<>();
                response.put("success", true);
                response.put("message", "Virement effectué avec succès");
                response.put("virement", mapVirement(virement));

                return response;
        }

        // ─── COMMISSION VALIDATION (admin → VALIDEE_ADMIN) ────
        @Transactional
        public Map<String, Object> validerCommission(int transactionId) {
                Transaction transaction = transactionRepository.findById(transactionId)
                                .orElseThrow(() -> new RuntimeException("Transaction introuvable"));

                String statutV = transaction.getStatut();
                boolean isEnAttenteV = statutV == null || "EN_ATTENTE".equals(statutV);
                if (transaction.getType() != TypeTransaction.COMMISSION || !isEnAttenteV) {
                        throw new RuntimeException("Commission non valide ou déjà traitée");
                }

                transaction.setStatut("VALIDEE_ADMIN");
                transactionRepository.save(transaction);

                notificationService.notifierCommissionValideeAdmin(transaction.getUser(), transaction.getMontant());

                Map<String, Object> response = new LinkedHashMap<>();
                response.put("success", true);
                response.put("message", "Commission approuvée par l'admin");
                response.put("commission", mapCommission(transaction));
                return response;
        }

        // ─── COMMISSION PAYMENT (comptable → VALIDEE + credit) ─
        @Transactional
        public Map<String, Object> payerCommission(int transactionId) {
                Transaction transaction = transactionRepository.findById(transactionId)
                                .orElseThrow(() -> new RuntimeException("Transaction introuvable"));

                if (transaction.getType() != TypeTransaction.COMMISSION) {
                        throw new RuntimeException("Transaction invalide : ce n'est pas une commission");
                }

                String statut = transaction.getStatut();
                if (!"EN_ATTENTE".equals(statut) && !"VALIDEE_ADMIN".equals(statut)) {
                        throw new RuntimeException("Commission déjà traitée ou dans un état invalide");
                }

                User user = transaction.getUser();
                double ancienSolde = user.getSoldeInterne() == null ? 0.0 : user.getSoldeInterne();
                user.setSoldeInterne(ancienSolde + transaction.getMontant());
                userRepository.save(user);

                transaction.setStatut("VALIDEE");
                transactionRepository.save(transaction);

                notificationService.notifierCommissionPayee(user, transaction.getMontant());

                Map<String, Object> response = new LinkedHashMap<>();
                response.put("success", true);
                response.put("message", "Commission créditée sur le solde du partenaire");
                response.put("commission", mapCommission(transaction));
                response.put("nouveauSolde", round(user.getSoldeInterne()));
                response.put("partenaireId", user.getId());
                return response;
        }

        // ─── COMMISSION BATCH APPROVAL (admin) ────────────────
        @Transactional
        public Map<String, Object> validerToutAdmin() {
                List<Transaction> enAttente = transactionRepository.findAll().stream()
                                .filter(t -> t.getType() == TypeTransaction.COMMISSION
                                                && (t.getStatut() == null || "EN_ATTENTE".equals(t.getStatut())))
                                .collect(Collectors.toList());

                enAttente.forEach(t -> {
                        t.setStatut("VALIDEE_ADMIN");
                        transactionRepository.save(t);
                        notificationService.notifierCommissionValideeAdmin(t.getUser(), t.getMontant());
                });

                Map<String, Object> response = new LinkedHashMap<>();
                response.put("success", true);
                response.put("validees", enAttente.size());
                return response;
        }

        @Transactional
        public Map<String, Object> refuserCommission(int transactionId) {
                Transaction transaction = transactionRepository.findById(transactionId)
                                .orElseThrow(() -> new RuntimeException("Transaction introuvable"));

                String statutR = transaction.getStatut();
                boolean isEnAttenteR = statutR == null || "EN_ATTENTE".equals(statutR);
                if (transaction.getType() != TypeTransaction.COMMISSION || !isEnAttenteR) {
                        throw new RuntimeException("Commission non valide ou déjà traitée");
                }

                transaction.setStatut("REFUSEE");
                transactionRepository.save(transaction);

                notificationService.notifierCommissionRefusee(transaction.getUser(), transaction.getMontant());

                Map<String, Object> response = new LinkedHashMap<>();
                response.put("success", true);
                response.put("message", "Commission refusée");
                response.put("commission", mapCommission(transaction));
                return response;
        }

        // ─── COMMISSION SUPPRESSION ────────────────────────────
        @Transactional
        public void supprimerCommission(int transactionId) {
                Transaction transaction = transactionRepository.findById(transactionId)
                                .orElseThrow(() -> new RuntimeException("Commission introuvable"));
                if (transaction.getType() != TypeTransaction.COMMISSION) {
                        throw new RuntimeException("Cette transaction n'est pas une commission");
                }
                transactionRepository.delete(transaction);
        }

        // ─── NOTIFICATIONS (delegate) ──────────────────────────
        public Object getNotifications(String email) {
                return notificationService.getMesNotifications(email);
        }

        public long countNotificationsNonLues(String email) {
                return notificationService.countNonLues(email);
        }

        @Transactional
        public void marquerNotificationsLues(String email) {
                notificationService.marquerToutesLues(email);
        }

        // ─── COMPTES EN ATTENTE (admin) ────────────────────────
        public List<Map<String, Object>> getComptesEnAttente() {
                return userRepository.findAll().stream()
                                .filter(u -> u.getRole() == Role.PARTENAIRE && !u.isStatut())
                                .map(u -> {
                                        Map<String, Object> m = new LinkedHashMap<>();
                                        m.put("id", u.getId());
                                        m.put("nom", u.getNom());
                                        m.put("email", u.getEmail());
                                        m.put("telephone", u.getTelephone());
                                        m.put("region", u.getRegion());
                                        m.put("pack", u.getPack() != null ? u.getPack().getNom() : "Aucun");
                                        m.put("parrain", u.getParrain() != null ? u.getParrain().getNom() : "—");
                                        m.put("modePaiement", u.getModePaiement());
                                        m.put("dateCreation", u.getDateCreation());
                                                // Informations de livraison venant de DemandeInscription
                                        demandeInscriptionRepository.findByUtilisateur(u).ifPresent(d -> {
                                                m.put("statutLivraison", d.getStatut().name());
                                                m.put("dateLivraison", d.getDateLivraison());
                                        });
                                        return m;
                                })
                                .collect(Collectors.toList());
        }

        @Transactional
        public Map<String, Object> approuverCompte(int userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
                user.setStatut(true);
                userRepository.save(user);
                notificationService.notifierCompteApprouve(user);
                Map<String, Object> r = new LinkedHashMap<>();
                r.put("success", true);
                r.put("message", "Compte de " + user.getNom() + " approuvé");
                return r;
        }

        @Transactional
        public Map<String, Object> rejeterCompte(int userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
                // Conserve l'utilisateur mais prévient — l'admin peut supprimer ou signaler manuellement
                notificationService.creer(user,
                                "❌ Demande refusée",
                                "Votre demande d'inscription a été refusée par l'administrateur.",
                                "COMPTE_REFUSE");
                Map<String, Object> r = new LinkedHashMap<>();
                r.put("success", true);
                r.put("message", "Compte de " + user.getNom() + " refusé");
                return r;
        }

        // ─── INSCRIPTIONS (delegate) ───────────────────────────
        public List<Map<String, Object>> getInscriptions() {
                return demandeInscriptionService.getDemandes();
        }

        public List<Map<String, Object>> getInscriptionsTraitees() {
                return demandeInscriptionService.getDemandesTraitees();
        }

        public List<Map<String, Object>> getPartenaires() {
                return userRepository.findByRole(Role.PARTENAIRE).stream()
                        .map(u -> {
                                Map<String, Object> m = new LinkedHashMap<>();
                                m.put("id", u.getId());
                                m.put("nom", u.getNom() != null ? u.getNom() : "");
                                m.put("email", u.getEmail());
                                m.put("region", u.getRegion() != null ? u.getRegion() : "");
                                m.put("telephone", u.getTelephone() != null ? u.getTelephone() : "");
                                return m;
                        })
                        .collect(Collectors.toList());
        }

        private double round(double value) {
                return Math.round(value * 100.0) / 100.0;
        }
}
