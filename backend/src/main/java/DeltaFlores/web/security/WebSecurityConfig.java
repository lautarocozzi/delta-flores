package DeltaFlores.web.security;

import DeltaFlores.web.service.SessionService;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@Log4j2
public class WebSecurityConfig {

    private final JwtUtils jwtUtils;
    private final SessionService sessionService;

    @Autowired
    public WebSecurityConfig(JwtUtils jwtUtils, SessionService sessionService) {
        this.jwtUtils = jwtUtils;
        this.sessionService = sessionService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, AuthenticationManager authenticationManager)
            throws Exception {
        log.info("Configuring Security Filter Chain...");
        JwtAuthenticationFilter jwtAuthenticationFilter = new JwtAuthenticationFilter(jwtUtils, authenticationManager, sessionService);
        jwtAuthenticationFilter.setFilterProcessesUrl("/login");

        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/login", "/swagger-ui/**", "/v3/api-docs/**", "/api/users/register",
                                "/api/users/seed-admin", "/api/users/check-username/**",
                                "/actuator/health", "/api/auth/refresh", "/api/auth/me")
                        .permitAll() // Allow registration, seeding, diagnose, refresh
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/comunidad/**").permitAll()
                        .requestMatchers("/api/auth/sessions/**").authenticated()
                        .anyRequest().authenticated())
                // .anyRequest().permitAll())
                .logout(logout -> logout
                        .logoutUrl("/api/logout")
                        .deleteCookies("jwt")
                        .logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler()))
                .addFilter(jwtAuthenticationFilter)
                .addFilterBefore(new JwtAuthorizationFilter(jwtUtils), UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration)
            throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:81", "http://localhost:80", "http://localhost:8082", "http://localhost:5173", "http://127.0.0.1:81", "http://127.0.0.1:80", "http://127.0.0.1:8082", "http://127.0.0.1:5173"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(List.of("Authorization"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}