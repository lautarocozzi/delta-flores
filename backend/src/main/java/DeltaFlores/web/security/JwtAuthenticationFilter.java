package DeltaFlores.web.security;

import DeltaFlores.web.dto.LoginRequestDto;
import DeltaFlores.web.entities.UserSession;
import DeltaFlores.web.service.SessionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Log4j2
public class JwtAuthenticationFilter extends UsernamePasswordAuthenticationFilter {

    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final SessionService sessionService;

    public JwtAuthenticationFilter(JwtUtils jwtUtils, AuthenticationManager authenticationManager, SessionService sessionService) {
        this.jwtUtils = jwtUtils;
        this.authenticationManager = authenticationManager;
        this.sessionService = sessionService;
    }

    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response)
            throws AuthenticationException {
        try {
            LoginRequestDto loginRequest = new ObjectMapper().readValue(request.getInputStream(),
                    LoginRequestDto.class);

            if (loginRequest == null || loginRequest.getUsername() == null || loginRequest.getPassword() == null) {
                throw new AuthenticationServiceException("Petición de login inválida.");
            }

            String username = loginRequest.getUsername().trim();
            String password = loginRequest.getPassword();

            if (username.isEmpty() || password.isEmpty()) {
                throw new AuthenticationServiceException("El usuario y la contraseña no pueden estar vacíos.");
            }

            log.info("Attempting authentication for user: {}", username);

            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(username, password);

            return authenticationManager.authenticate(authToken);

        } catch (IOException e) {
            log.error("Error al procesar la petición de login: {}", e.getMessage());
            throw new AuthenticationServiceException("Error al procesar la petición de login.", e);
        }
    }

    @Override
    protected void successfulAuthentication(HttpServletRequest request, HttpServletResponse response, FilterChain chain,
            Authentication authResult) throws IOException, ServletException {
        UserDetails userPrincipal = (UserDetails) authResult.getPrincipal();

        // Generate access token (short-lived, 30min default)
        String accessToken = jwtUtils.generateAccessToken(userPrincipal);

        // Create session (generates UUID, saves with placeholder hash)
        Long userId = ((CustomUserDetails) userPrincipal).getId();
        UserSession session = sessionService.createSession(userId, "", request);

        // Generate refresh token with embedded session_id (uses the session's UUID)
        String refreshToken = jwtUtils.generateRefreshToken(userPrincipal, session.getId());

        // Update session with the real refresh token hash
        sessionService.updateSessionHash(session, refreshToken);

        // Set refresh token in HttpOnly cookie (never exposed to JavaScript)
        Cookie refreshCookie = new Cookie("refresh_token", refreshToken);
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(request.isSecure());
        refreshCookie.setPath("/");
        refreshCookie.setMaxAge(7 * 24 * 60 * 60); // 7 days
        refreshCookie.setAttribute("SameSite", "Lax"); // Lax for refresh flow
        response.addCookie(refreshCookie);

        // Remove old 'jwt' cookie if present (migration cleanup)
        Cookie oldJwtCookie = new Cookie("jwt", null);
        oldJwtCookie.setMaxAge(0);
        oldJwtCookie.setHttpOnly(true);
        oldJwtCookie.setPath("/");
        response.addCookie(oldJwtCookie);

        log.info("\n\n✅ Login exitoso para el usuario: {}\n", userPrincipal.getUsername());

        // Return access token + user info in response body
        Map<String, Object> body = new HashMap<>();
        body.put("access_token", accessToken);
        body.put("username", userPrincipal.getUsername());
        body.put("roles", userPrincipal.getAuthorities());

        // Set response status, content type, and body
        response.setStatus(200);
        response.setContentType("application/json");
        response.getWriter().write(new ObjectMapper().writeValueAsString(body));
    }

    @Override
    protected void unsuccessfulAuthentication(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException failed) throws IOException, ServletException {
        log.warn("\n\n❌❌❌ Intento de login fallido ❌❌❌\n" +
                "Motivo: {}\n" +
                "Desde IP: {}",
                failed.getMessage(), request.getRemoteAddr());

        Map<String, Object> body = new HashMap<>();
        body.put("error", "Error de autenticación: Usuario o contraseña incorrectos.");
        body.put("detalle", failed.getMessage());

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write(new ObjectMapper().writeValueAsString(body));
    }
}
