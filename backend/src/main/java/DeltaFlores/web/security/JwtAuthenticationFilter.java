package DeltaFlores.web.security;

import DeltaFlores.web.dto.LoginRequestDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import lombok.extern.log4j.Log4j2;


@Log4j2
public class JwtAuthenticationFilter extends UsernamePasswordAuthenticationFilter {

    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;

    public JwtAuthenticationFilter(JwtUtils jwtUtils, AuthenticationManager authenticationManager) {

        this.jwtUtils = jwtUtils;
        this.authenticationManager = authenticationManager;
    }

    public JwtAuthenticationFilter(AuthenticationManager authenticationManager, JwtUtils jwtUtils, AuthenticationManager authenticationManager1) {
        super(authenticationManager);
        this.jwtUtils = jwtUtils;
        this.authenticationManager = authenticationManager1;
    }

    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) throws AuthenticationException {
        try {
            LoginRequestDto loginRequest = new ObjectMapper().readValue(request.getInputStream(), LoginRequestDto.class);

            // "Sanitizer" Step 1: Basic validation and sanitization
            if (loginRequest == null || loginRequest.getUsername() == null || loginRequest.getPassword() == null) {
                throw new AuthenticationServiceException("Petición de login inválida.");
            }

            String username = loginRequest.getUsername().trim(); // Sanitize: trim whitespace
            String password = loginRequest.getPassword();

            if (username.isEmpty() || password.isEmpty()) {
                throw new AuthenticationServiceException("El usuario y la contraseña no pueden estar vacíos.");
            }

            log.info("Attempting authentication for user: {}", username);

            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(username, password);

            // "Anti-Bypass" is handled here by Spring's secure AuthenticationManager
            return authenticationManager.authenticate(authToken);

        } catch (IOException e) {
            log.error("Error al procesar la petición de login: {}", e.getMessage());
            throw new AuthenticationServiceException("Error al procesar la petición de login.", e);
        }
    }

    @Override
    protected void successfulAuthentication(HttpServletRequest request, HttpServletResponse response, FilterChain chain, Authentication authResult) throws IOException, ServletException {
        User user = (User) authResult.getPrincipal();
        String token = jwtUtils.generateToken(user);

        // Create HttpOnly cookie
        Cookie jwtCookie = new Cookie("jwt", token);
        jwtCookie.setHttpOnly(true);
        jwtCookie.setSecure(true); // Should be true in production
        jwtCookie.setPath("/");
        jwtCookie.setMaxAge(24 * 60 * 60); // 1 day
        response.addCookie(jwtCookie);

        log.info("\n\n✅ Login exitoso para el usuario: {}", user.getUsername()+"\n\n");

        // Write user info to response body
        Map<String, Object> body = new HashMap<>();
        body.put("username", user.getUsername());
        body.put("roles", user.getAuthorities());

        response.getWriter().write(new ObjectMapper().writeValueAsString(body));
        response.setStatus(200);
        response.setContentType("application/json");
    }

    @Override
    protected void unsuccessfulAuthentication(HttpServletRequest request, HttpServletResponse response, AuthenticationException failed) throws IOException, ServletException {
        log.warn("\n\n❌❌❌ Intento de login fallido ❌❌❌\n" +
                 "Motivo: {}\n" +
                 "Desde IP: {}",
                failed.getMessage(), request.getRemoteAddr()+"\n\n");

        Map<String, Object> body = new HashMap<>();
        body.put("error", "Error de autenticación: Usuario o contraseña incorrectos.");
        body.put("detalle", failed.getMessage());

        response.getWriter().write(new ObjectMapper().writeValueAsString(body));
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
    }
}