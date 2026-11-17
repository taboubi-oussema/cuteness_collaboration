package com.cuteness.backend.service;

import com.cuteness.backend.dto.*;
import com.cuteness.backend.entity.OtpToken;
import com.cuteness.backend.entity.Pack;
import com.cuteness.backend.entity.PasswordResetToken;
import com.cuteness.backend.entity.PendingRegistration;
import com.cuteness.backend.entity.User;
import com.cuteness.backend.enums.OtpContext;
import com.cuteness.backend.enums.Role;
import com.cuteness.backend.repository.OtpTokenRepository;
import com.cuteness.backend.repository.PackRepository;
import com.cuteness.backend.repository.PasswordResetTokenRepository;
import com.cuteness.backend.repository.PendingRegistrationRepository;
import com.cuteness.backend.repository.UserRepository;
import com.cuteness.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.security.SecureRandom;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository                 userRepository;
    private final PasswordEncoder                passwordEncoder;
    private final JwtUtil                        jwtUtil;
    private final PackRepository                 packRepository;
    private final PasswordResetTokenRepository   tokenRepository;
    private final OtpTokenRepository             otpTokenRepository;
    private final PendingRegistrationRepository  pendingRepository;
    private final JavaMailSender                 mailSender;
    private final DemandeInscriptionService      demandeInscriptionService;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int MIN_PASSWORD_LENGTH = 8;

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url:http://localhost:4200}")
    private String frontendUrl;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.username}")
    private String mailFrom;

    private static void checkPasswordStrength(String password) {
        if (password == null || password.length() < MIN_PASSWORD_LENGTH) {
            throw new RuntimeException("Le mot de passe doit contenir au moins "
                    + MIN_PASSWORD_LENGTH + " caractères");
        }
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);

        if (user == null
                || request.getMotDePasse() == null
                || !passwordEncoder.matches(request.getMotDePasse(), user.getMotDePasse()))
            throw new RuntimeException("Email ou mot de passe incorrect");

        if (!Boolean.TRUE.equals(user.getEmailVerified()))
            throw new RuntimeException("Veuillez vérifier votre adresse email avant de vous connecter.");

        if (!user.isStatut())
            throw new com.cuteness.backend.exception.AccountInactiveException(
                    "Compte en attente de validation par l'administrateur");

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getEmail(), user.getNom(),
                (long) user.getId(), user.getRole().name(),
                user.getSoldeInterne(), user.getNiveau());
    }

    @Transactional
    public String register(RegisterRequest request) {

        checkPasswordStrength(request.getMotDePasse());

        if (userRepository.existsByEmail(request.getEmail()))
            throw new RuntimeException("Email déjà utilisé");

        if (request.getCodeParrainage() != null && !request.getCodeParrainage().isBlank()) {
            userRepository.findByCodeParrainage(request.getCodeParrainage())
                    .orElseThrow(() -> new RuntimeException("Code parrainage invalide"));
        }

        if (request.getPackId() != null) {
            packRepository.findById(request.getPackId())
                    .orElseThrow(() -> new RuntimeException("Pack introuvable"));
        }

        pendingRepository.deleteByEmail(request.getEmail());

        PendingRegistration pending = PendingRegistration.builder()
                .email(request.getEmail())
                .nom(request.getNom())
                .motDePasse(passwordEncoder.encode(request.getMotDePasse()))
                .telephone(request.getTelephone())
                .packId(request.getPackId())
                .codeParrainage(request.getCodeParrainage())
                .region(request.getRegion())
                .modePaiement(request.getModePaiement())
                .banque(request.getBanque())
                .infoBancaire(request.getInfoBancaire())
                .expiryDate(java.time.LocalDateTime.now().plusMinutes(10))
                .build();

        pendingRepository.save(pending);

        String otp = generateOtp();
        otpTokenRepository.deleteByEmailAndContext(request.getEmail(), OtpContext.REGISTRATION);
        otpTokenRepository.save(new OtpToken(otp, request.getEmail(), OtpContext.REGISTRATION));
        sendOtpEmail(request.getEmail(), otp);

        return "Un code de vérification a été envoyé à " + request.getEmail()
                + ". Veuillez vérifier votre adresse email.";
    }

    @Transactional
    public String verifyOtp(VerifyOtpRequest request) {
        OtpToken otpToken = otpTokenRepository
                .findByEmailAndContext(request.getEmail(), OtpContext.REGISTRATION)
                .orElseThrow(() -> new RuntimeException("Code OTP invalide ou inexistant"));

        if (!otpToken.getOtp().equals(request.getOtp()))
            throw new RuntimeException("Code OTP incorrect");

        if (otpToken.isExpired()) {
            otpTokenRepository.delete(otpToken);
            pendingRepository.deleteByEmail(request.getEmail());
            throw new RuntimeException("Code OTP expiré. Veuillez en demander un nouveau.");
        }

        PendingRegistration pending = pendingRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Données d'inscription introuvables. Veuillez recommencer."));

        User parrain = null;
        if (pending.getCodeParrainage() != null && !pending.getCodeParrainage().isBlank()) {
            parrain = userRepository.findByCodeParrainage(pending.getCodeParrainage())
                    .orElseThrow(() -> new RuntimeException("Code parrainage invalide"));
        }

        Pack pack = null;
        double tauxReduction = 0.0;
        if (pending.getPackId() != null) {
            pack = packRepository.findById(pending.getPackId())
                    .orElseThrow(() -> new RuntimeException("Pack introuvable"));
            tauxReduction = pack.getTauxReduction();
        }

        User user = User.builder()
                .nom(pending.getNom())
                .email(pending.getEmail())
                .motDePasse(pending.getMotDePasse())
                .telephone(pending.getTelephone())
                .region(pending.getRegion())
                .role(Role.PARTENAIRE)
                .codeParrainage(generateUniqueCode())
                .parrain(parrain)
                .pack(pack)
                .tauxReduction(tauxReduction)
                .modePaiement(pending.getModePaiement())
                .banque(pending.getBanque())
                .infoBancaire(pending.getInfoBancaire())
                .statut(false)
                .emailVerified(true)
                .build();

        User savedUser = userRepository.save(user);

        demandeInscriptionService.creerDemande(savedUser);

        otpTokenRepository.delete(otpToken);
        pendingRepository.delete(pending);

        return "Email vérifié avec succès. Votre compte est en attente de validation par l'administrateur.";
    }

    @Transactional
    public String resendOtp(ResendOtpRequest request) {
        if (pendingRepository.existsByEmail(request.getEmail())) {
            pendingRepository.findByEmail(request.getEmail()).ifPresent(p -> {
                p.setExpiryDate(java.time.LocalDateTime.now().plusMinutes(10));
                pendingRepository.save(p);
            });
        } else {
            userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("Email introuvable"));
        }

        String otp = generateOtp();
        otpTokenRepository.deleteByEmailAndContext(request.getEmail(), OtpContext.REGISTRATION);
        otpTokenRepository.save(new OtpToken(otp, request.getEmail(), OtpContext.REGISTRATION));
        sendOtpEmail(request.getEmail(), otp);

        return "Un nouveau code de vérification a été envoyé à " + request.getEmail();
    }

    private String generateOtp() {
        return String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
    }

    private void sendOtpEmail(String to, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(to);
        message.setSubject("Cuteness Collaboration — Vérification de votre email");
        message.setText(
            "Bonjour,\n\n"
            + "Merci de vous être inscrit sur Cuteness Collaboration !\n\n"
            + "Votre code de vérification est :\n\n"
            + "  " + otp + "\n\n"
            + "Ce code est valable pendant 10 minutes.\n\n"
            + "Si vous n'avez pas créé de compte, ignorez cet email.\n\n"
            + "— L'équipe Cuteness Collaboration"
        );
        mailSender.send(message);
    }

    private String generateUniqueCode() {
        String code;
        do {
            code = "CUTE-" + UUID.randomUUID()
                    .toString().substring(0, 6).toUpperCase();
        } while (userRepository.existsByCodeParrainage(code));
        return code;
    }

    @Transactional
    public String requestPasswordReset(String email) {
        final String genericAnswer =
                "Si un compte existe pour cette adresse, un lien de réinitialisation vient d'être envoyé.";

        if (email == null || userRepository.findByEmail(email).isEmpty()) {
            return genericAnswer;   // same answer whether or not the account exists
        }

        tokenRepository.deleteByEmail(email);

        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken(token, email);
        tokenRepository.save(resetToken);

        String resetLink = frontendUrl + "/auth/reset-password?token=" + token;
        sendResetEmail(email, resetLink);

        return genericAnswer;
    }

    private void sendResetEmail(String to, String link) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(to);
        message.setSubject("Cuteness Collaboration — Réinitialiser votre mot de passe");
        message.setText(
            "Bonjour,\n\n"
            + "Vous avez demandé la réinitialisation de votre mot de passe.\n\n"
            + "Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :\n"
            + link + "\n\n"
            + "Ce lien expire dans 1 heure.\n\n"
            + "Si vous n'avez pas fait cette demande, ignorez cet email.\n\n"
            + "— L'équipe Cuteness Collaboration"
        );
        mailSender.send(message);
    }

    @Transactional
    public String changePassword(ChangePasswordRequest request) {
        checkPasswordStrength(request.getNouveauMotDePasse());
        if (!request.getNouveauMotDePasse()
                .equals(request.getConfirmation())) {
            throw new RuntimeException("Les mots de passe ne correspondent pas");
        }

        PasswordResetToken resetToken = tokenRepository
                .findByToken(request.getToken())
                .orElseThrow(() -> new RuntimeException("Token invalide ou déjà utilisé"));

        if (resetToken.isExpired()) {
            tokenRepository.delete(resetToken);
            throw new RuntimeException("Le lien a expiré. Veuillez refaire une demande.");
        }

        User user = userRepository.findByEmail(resetToken.getEmail())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        user.setMotDePasse(passwordEncoder.encode(request.getNouveauMotDePasse()));
        userRepository.save(user);

        tokenRepository.delete(resetToken);

        return "Mot de passe modifié avec succès";
    }
}
