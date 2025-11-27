package DeltaFlores.web.security;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.WebUtils;

import java.io.IOException;

@Log4j2
public class JwtAuthorizationFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;

    public JwtAuthorizationFilter(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        Cookie jwtCookie = WebUtils.getCookie(request, "jwt");

        if (jwtCookie == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = jwtCookie.getValue();
        String username = null;

        try {
            username = jwtUtils.extractUsername(token);
        } catch (JwtException e) {
            log.warn("Invalid JWT token received: {}", e.getMessage());
            filterChain.doFilter(request, response);
            return;
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            // Extract claims
            String role = jwtUtils.extractClaim(token, claims -> claims.get("user_role", String.class));
            Number userIdNumber = jwtUtils.extractClaim(token, claims -> claims.get("user_id", Number.class));
            Long userId = (userIdNumber != null) ? userIdNumber.longValue() : null;

            if (userId != null && role != null) {
                // Create CustomUserDetails to serve as the principal
                CustomUserDetails principal = new CustomUserDetails(
                        userId,
                        username,
                        "", // Password is not needed for the principal in this context
                        AuthorityUtils.createAuthorityList(role)
                );

                if (jwtUtils.validateToken(token, principal)) {
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            principal, null, principal.getAuthorities());
                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    log.info("\n" +
                            "---------------------------------------------------------------------------------------------------------" +
                            "\n🔒 Acceso autorizado 🔒\n" +
                             "Usuario: {}\n" +
                             "ID: {}\n" +
                             "Rol: {}", principal.getUsername(), principal.getId(), role);
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
