package DeltaFlores.web.security;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Log4j2
public class JwtAuthorizationFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;

    public JwtAuthorizationFilter(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Read access token from Authorization header
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken == null || !bearerToken.startsWith("Bearer ")) {
            // No token → continue without authentication (let Spring Security handle)
            filterChain.doFilter(request, response);
            return;
        }

        String token = bearerToken.substring(7);

        String username;
        try {
            username = jwtUtils.extractUsername(token);
        } catch (JwtException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            sendUnauthorized(response, "Token inválido o expirado");
            return;
        }

        // Validate that this is an ACCESS token, not a refresh token
        if (!jwtUtils.validateTokenType(token, JwtUtils.TOKEN_TYPE_ACCESS)) {
            log.warn("Token is not a valid access token (expired or wrong type)");
            sendUnauthorized(response, "Access token inválido o expirado");
            return;
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            String role = jwtUtils.extractUserRole(token);
            Long userId = jwtUtils.extractUserId(token);

            if (userId != null && role != null) {
                CustomUserDetails principal = new CustomUserDetails(
                        userId,
                        username,
                        "",
                        AuthorityUtils.createAuthorityList(role));

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        principal, null, principal.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        filterChain.doFilter(request, response);
    }

    private void sendUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"" + message + "\"}");
    }
}
