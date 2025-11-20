package DeltaFlores.web.security;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.WebUtils;

import java.io.IOException;
import java.util.List;

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
            String role = jwtUtils.extractClaim(token, claims -> claims.get("user_role", String.class));
            User userDetails = new User(username, "", AuthorityUtils.createAuthorityList(role));

            if (jwtUtils.validateToken(token, userDetails)) {
                List<GrantedAuthority> authorities = AuthorityUtils.createAuthorityList(role);
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(authentication);
                log.info("User '{}' authenticated successfully with role '{}'.", username, role);
            }
        }

        filterChain.doFilter(request, response);
    }
}
