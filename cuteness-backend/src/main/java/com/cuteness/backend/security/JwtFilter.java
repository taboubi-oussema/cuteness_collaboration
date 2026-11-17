package com.cuteness.backend.security;

import com.cuteness.backend.entity.User;
import com.cuteness.backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.List;
import java.util.Optional;

// Not a @Component on purpose: it is created and added in SecurityConfig, so it runs only once, inside the security chain.
@RequiredArgsConstructor
@Slf4j
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                if (jwtUtil.isTokenValid(token)) {
                    String email = jwtUtil.extractEmail(token);

                    Optional<User> userOpt = userRepository.findByEmail(email);
                    if (userOpt.isPresent()) {
                        User user = userOpt.get();
                        // Reject inactive accounts immediately even if JWT is unexpired
                        if (user.isStatut() && Boolean.TRUE.equals(user.getEmailVerified())) {
                            String roleName = user.getRole() != null ? user.getRole().name() : jwtUtil.extractRole(token);
                            UserDetails userDetails = org.springframework.security.core.userdetails.User
                                    .withUsername(user.getEmail())
                                    .password("")
                                    .authorities(List.of(new SimpleGrantedAuthority("ROLE_" + roleName)))
                                    .build();

                            var auth = new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities()
                            );
                            SecurityContextHolder.getContext().setAuthentication(auth);
                        } else {
                            log.warn("Blocked request from inactive/unverified user: {}", email);
                        }
                    } else {
                        log.warn("Blocked request for non-existent user: {}", email);
                    }
                }
            } catch (Exception e) {
                log.warn("JWT validation failed: {}", e.getMessage());
            }
        }
        filterChain.doFilter(request, response);
    }
}
