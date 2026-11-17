package com.cuteness.backend.config;

import com.cuteness.backend.security.JwtFilter;
import com.cuteness.backend.security.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    /** Origins of the Capacitor mobile app (always allowed). */
    private static final List<String> MOBILE_ORIGINS = List.of(
        "capacitor://localhost",
        "https://localhost",
        "http://localhost"
    );

    /** Local development origins (disable with cors.dev-origins=false in production). */
    private static final List<String> DEV_ORIGINS = List.of(
        "http://localhost:4200",
        "http://localhost:4201",
        "http://localhost:54536",
        "http://localhost:54537",
        "http://localhost:3000"
    );

    private final JwtUtil jwtUtil;
    private final com.cuteness.backend.repository.UserRepository userRepository;

    @Value("${cors.allowed-origins:}")
    private String configuredOrigins;

    @Value("${cors.dev-origins:true}")
    private boolean allowDevOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // Stateless API: the JWT travels in the Authorization header (no cookies), so CSRF does not apply.
            .csrf(csrf -> csrf.disable())
            .headers(headers -> headers
                .frameOptions(frame -> frame.deny())
                .contentTypeOptions(content -> {})
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000))
            )
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(authenticationEntryPoint())
                .accessDeniedHandler(accessDeniedHandler()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/error").permitAll()

                // Authentication flow
                .requestMatchers(HttpMethod.POST,
                    "/api/auth/login",
                    "/api/auth/register",
                    "/api/auth/verify-otp",
                    "/api/auth/resend-otp",
                    "/api/auth/reset-password",
                    "/api/auth/change-password").permitAll()

                // Public website content (home, packs, shop, formations)
                .requestMatchers(HttpMethod.GET,
                    "/api/packs", "/api/packs/{id}",
                    "/api/challenges",
                    "/api/formations", "/api/formations/{id}",
                    "/api/content", "/api/content/{section}",
                    "/api/grade-configs/public",
                    "/api/produits", "/api/produits/{id}", "/api/produits/{id}/avis",
                    "/api/categories", "/api/categories/{id}",
                    "/uploads/**").permitAll()

                // Public chatbot (rate limited in ChatController)
                .requestMatchers(HttpMethod.POST, "/api/chat").permitAll()

                // Everything else requires a valid JWT. Role checks are done with @PreAuthorize.
                .anyRequest().authenticated()
            )
            .addFilterBefore(new JwtFilter(jwtUtil, userRepository), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        List<String> origins = new ArrayList<>(MOBILE_ORIGINS);
        if (allowDevOrigins) {
            origins.addAll(DEV_ORIGINS);
        }
        Arrays.stream(configuredOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty() && !s.equals("*"))
                .forEach(origins::add);

        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        config.setAllowCredentials(true);
        config.setExposedHeaders(List.of("Authorization"));
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationEntryPoint authenticationEntryPoint() {
        return (HttpServletRequest request, HttpServletResponse response,
                org.springframework.security.core.AuthenticationException authException) -> {
            response.setContentType("application/json;charset=UTF-8");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"Veuillez vous connecter\"}");
        };
    }

    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (HttpServletRequest request, HttpServletResponse response,
                org.springframework.security.access.AccessDeniedException ex) -> {
            response.setContentType("application/json;charset=UTF-8");
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write("{\"error\":\"Forbidden\",\"message\":\"Accès refusé\"}");
        };
    }
}
