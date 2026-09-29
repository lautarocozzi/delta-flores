package DeltaFlores.web.security;

import DeltaFlores.web.entities.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

@Component
public class JwtUtils {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration.ms}")
    private long jwtExpirationMs;

    @Value("${jwt.refresh.expiration.ms:604800000}")
    private long refreshExpirationMs;

    // --- Token type constants ---
    public static final String TOKEN_TYPE_ACCESS = "access";
    public static final String TOKEN_TYPE_REFRESH = "refresh";

    // --- Shared parsing ---

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public Long extractUserId(String token) {
        return extractClaim(token, claims -> claims.get("user_id", Long.class));
    }

    public String extractUserRole(String token) {
        return extractClaim(token, claims -> claims.get("user_role", String.class));
    }

    public String extractTokenType(String token) {
        return extractClaim(token, claims -> claims.get("token_type", String.class));
    }

    public UUID extractSessionId(String token) {
        try {
            return extractClaim(token, claims -> {
                String sid = claims.get("session_id", String.class);
                return sid != null ? UUID.fromString(sid) : null;
            });
        } catch (Exception e) {
            return null; // Legacy tokens without session_id
        }
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token).getBody();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // --- Access Token ---

    /**
     * Generate short-lived access token (configurable, default 30min).
     * Used in Authorization: Bearer header on frontend.
     */
    public String generateAccessToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        if (!userDetails.getAuthorities().isEmpty()) {
            String role = userDetails.getAuthorities().iterator().next().getAuthority();
            claims.put("user_role", role);
        }
        if (userDetails instanceof CustomUserDetails) {
            claims.put("user_id", ((CustomUserDetails) userDetails).getId());
        }
        claims.put("token_type", TOKEN_TYPE_ACCESS);

        return createToken(claims, userDetails.getUsername(), jwtExpirationMs);
    }

    // --- Refresh Token ---

    /**
     * Generate long-lived refresh token (default 7 days).
     * Stored in HttpOnly cookie, never exposed to JS.
     */
    public String generateRefreshToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        if (!userDetails.getAuthorities().isEmpty()) {
            String role = userDetails.getAuthorities().iterator().next().getAuthority();
            claims.put("user_role", role);
        }
        if (userDetails instanceof CustomUserDetails) {
            claims.put("user_id", ((CustomUserDetails) userDetails).getId());
        }
        claims.put("token_type", TOKEN_TYPE_REFRESH);

        return createToken(claims, userDetails.getUsername(), refreshExpirationMs);
    }

    /**
     * Generate long-lived refresh token with embedded session_id.
     * Used when creating a new session on login.
     */
    public String generateRefreshToken(UserDetails userDetails, UUID sessionId) {
        Map<String, Object> claims = new HashMap<>();
        if (!userDetails.getAuthorities().isEmpty()) {
            String role = userDetails.getAuthorities().iterator().next().getAuthority();
            claims.put("user_role", role);
        }
        if (userDetails instanceof CustomUserDetails) {
            claims.put("user_id", ((CustomUserDetails) userDetails).getId());
        }
        claims.put("token_type", TOKEN_TYPE_REFRESH);
        claims.put("session_id", sessionId.toString());

        return createToken(claims, userDetails.getUsername(), refreshExpirationMs);
    }

    // --- Token creation ---

    private String createToken(Map<String, Object> claims, String subject, long expirationMs) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // --- Validation ---

    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    /**
     * Quick validation: check token is not expired and has expected type.
     * Used in authorization filter where we don't need full UserDetails.
     */
    public Boolean validateTokenType(String token, String expectedType) {
        try {
            String tokenType = extractTokenType(token);
            return !isTokenExpired(token) && expectedType.equals(tokenType);
        } catch (Exception e) {
            return false;
        }
    }

    // --- Key ---

    private Key getSigningKey() {
        byte[] keyBytes = secret.getBytes();
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
