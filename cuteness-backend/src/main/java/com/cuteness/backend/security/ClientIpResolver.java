package com.cuteness.backend.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Resolves the client IP for rate limiting.
 * X-Forwarded-For is a header the client can fake, so it is only used when
 * app.trust-proxy-headers=true (i.e. the API sits behind your own reverse proxy).
 */
@Component
public class ClientIpResolver {

    @Value("${app.trust-proxy-headers:false}")
    private boolean trustProxyHeaders;

    public String resolve(HttpServletRequest request) {
        if (trustProxyHeaders) {
            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                // The proxy appends the real client address last; take the right-most entry.
                String[] parts = forwarded.split(",");
                return parts[parts.length - 1].trim();
            }
        }
        return request.getRemoteAddr();
    }
}
