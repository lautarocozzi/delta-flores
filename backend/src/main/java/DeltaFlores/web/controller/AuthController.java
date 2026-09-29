package DeltaFlores.web.controller;

import DeltaFlores.web.dto.DeviceSessionGroupDto;
import DeltaFlores.web.dto.SessionResponseDto;
import DeltaFlores.web.dto.UserDto;
import DeltaFlores.web.security.CustomUserDetails;
import DeltaFlores.web.security.JwtUtils;
import DeltaFlores.web.service.SessionService;
import DeltaFlores.web.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.WebUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Log4j2
public class AuthController {

    private final JwtUtils jwtUtils;
    private final UserService userService;
    private final SessionService sessionService;

    /**
     * POST /api/auth/refresh
     * Reads the refresh_token HttpOnly cookie and returns a new access token.
     * Called by frontend on 401 or on page load.
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        log.debug("Refresh token request received");

        Cookie refreshCookie = WebUtils.getCookie(request, "refresh_token");
        if (refreshCookie == null || refreshCookie.getValue() == null) {
            log.warn("No refresh_token cookie found");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "No refresh token"));
        }

        String refreshToken = refreshCookie.getValue();

        // Validate refresh token
        if (!jwtUtils.validateTokenType(refreshToken, JwtUtils.TOKEN_TYPE_REFRESH)) {
            log.warn("Invalid or expired refresh token");
            clearRefreshCookie(response);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Refresh token inválido o expirado"));
        }

        String username = jwtUtils.extractUsername(refreshToken);
        Long userId = jwtUtils.extractUserId(refreshToken);
        String role = jwtUtils.extractUserRole(refreshToken);

        if (username == null || userId == null) {
            clearRefreshCookie(response);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Token corrupto"));
        }

        // Validate session + rotate refresh token (single transaction)
        UUID sessionId = jwtUtils.extractSessionId(refreshToken);
        if (sessionId == null) {
            // Legacy token without session_id — reject
            log.warn("Refresh token without session_id, rejecting legacy token");
            clearRefreshCookie(response);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Token legacy inválido, re-login requerido"));
        }

        // Generate new refresh token first (need it for hash rotation)
        CustomUserDetails userDetails = new CustomUserDetails(
                userId, username, "",
                org.springframework.security.core.authority.AuthorityUtils.createAuthorityList(role));
        String newRefreshToken = jwtUtils.generateRefreshToken(userDetails, sessionId);

        // Validate + rotate hash in one transaction (verifies old token matches stored hash)
        boolean valid = sessionService.validateAndRotateSession(sessionId, refreshToken, newRefreshToken).isPresent();
        if (!valid) {
            log.warn("Session revoked or not found: {}", sessionId);
            clearRefreshCookie(response);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Session revoked"));
        }

        // Generate new access token
        String newAccessToken = jwtUtils.generateAccessToken(userDetails);

        // Set new refresh token cookie
        Cookie newRefreshCookie = new Cookie("refresh_token", newRefreshToken);
        newRefreshCookie.setHttpOnly(true);
        newRefreshCookie.setSecure(request.isSecure());
        newRefreshCookie.setPath("/");
        newRefreshCookie.setMaxAge(30 * 24 * 60 * 60); // 30 days (matches SESSION_MAX_INACTIVE)
        newRefreshCookie.setAttribute("SameSite", "Lax");
        response.addCookie(newRefreshCookie);

        log.info("✅ Access token refreshed for user: {} (rotation applied)", username);

        Map<String, Object> body = new HashMap<>();
        body.put("access_token", newAccessToken);
        body.put("username", username);
        body.put("role", role);
        body.put("user_id", userId);

        return ResponseEntity.ok(body);
    }

    /**
     * GET /api/auth/me
     * Returns the current authenticated user's profile.
     * Works with valid access token in Authorization header.
     */
    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Object principal = authentication.getPrincipal();
        Long userId = null;
        String username = null;

        if (principal instanceof CustomUserDetails) {
            userId = ((CustomUserDetails) principal).getId();
            username = ((CustomUserDetails) principal).getUsername();
        } else if (principal instanceof String) {
            username = (String) principal;
        }

        if (userId != null) {
            try {
                UserDto user = userService.getUserById(userId);
                return ResponseEntity.ok(user);
            } catch (Exception e) {
                log.error("Error fetching current user: {}", e.getMessage());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }

        // Fallback: return minimal info from token
        UserDto dto = new UserDto();
        dto.setUsername(username);
        return ResponseEntity.ok(dto);
    }

    /**
     * POST /api/auth/logout
     * Invalidates the refresh token cookie.
     */
    @PostMapping("/logout")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        log.info("\n\n🚪 Logout request received\n");

        // Revoke the current session if session_id is present
        UUID sessionId = extractSessionIdFromCookie(request);
        if (sessionId != null) {
            Long userId = jwtUtils.extractUserId(
                    WebUtils.getCookie(request, "refresh_token").getValue());
            if (userId != null) {
                sessionService.revokeSession(sessionId, userId);
            }
        }

        clearRefreshCookie(response);
        log.info("\n\n✅ Logout exitoso: Refresh cookie invalidada\n");
        return ResponseEntity.ok().build();
    }

    /**
     * GET /api/auth/sessions
     * Lists all active sessions grouped by device for the authenticated user.
     */
    @GetMapping("/sessions")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<List<DeviceSessionGroupDto>> listSessions(HttpServletRequest request, Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof CustomUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        CustomUserDetails userDetails = (CustomUserDetails) principal;
        Long userId = userDetails.getId();

        UUID currentSessionId = extractSessionIdFromCookie(request);

        // Fallback: if cookie has no session_id, use the most recent session as "current"
        if (currentSessionId == null) {
            currentSessionId = sessionService.findMostRecentSessionId(userId);
        }

        List<DeviceSessionGroupDto> sessions = sessionService.groupByDevice(userId, currentSessionId);
        return ResponseEntity.ok(sessions);
    }

    /**
     * DELETE /api/auth/sessions/device/{deviceKey}
     * Revokes all sessions for a specific device group.
     * If the current device is revoked, the frontend's 401 interceptor handles logout.
     */
    @DeleteMapping("/sessions/device/{deviceKey}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> revokeDeviceSessions(
            @PathVariable String deviceKey, HttpServletRequest request, Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long userId = userDetails.getId();

        UUID currentSessionId = extractSessionIdFromCookie(request);
        if (currentSessionId == null) {
            currentSessionId = sessionService.findMostRecentSessionId(userId);
        }

        int revokedCount = sessionService.revokeByDeviceKey(userId, deviceKey, currentSessionId);
        return ResponseEntity.ok(Map.of("revokedCount", revokedCount));
    }

    /**
     * DELETE /api/auth/sessions/{id}
     * Revokes a single session by ID. User must own the session.
     */
    @DeleteMapping("/sessions/{id}")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<Void> revokeSession(@PathVariable UUID id, Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long userId = userDetails.getId();

        boolean revoked = sessionService.revokeSession(id, userId);
        if (!revoked) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok().build();
    }

    /**
     * DELETE /api/auth/sessions
     * Revokes all sessions except the current one.
     */
    @DeleteMapping("/sessions")
    @PreAuthorize("hasRole('GROWER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> revokeAllSessions(HttpServletRequest request, Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long userId = userDetails.getId();

        UUID currentSessionId = extractSessionIdFromCookie(request);
        if (currentSessionId == null) {
            currentSessionId = sessionService.findMostRecentSessionId(userId);
        }

        int revokedCount;
        if (currentSessionId != null) {
            revokedCount = sessionService.revokeAllExceptCurrent(userId, currentSessionId);
        } else {
            // Legacy token without session_id — revoke all
            List<SessionResponseDto> allSessions = sessionService.listSessions(userId, null);
            revokedCount = 0;
            for (SessionResponseDto session : allSessions) {
                if (sessionService.revokeSession(session.id(), userId)) {
                    revokedCount++;
                }
            }
        }

        return ResponseEntity.ok(Map.of("revokedCount", revokedCount));
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        Cookie refreshCookie = new Cookie("refresh_token", null);
        refreshCookie.setMaxAge(0);
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(false); // Irrelevant for cookie deletion (maxAge=0)
        refreshCookie.setPath("/");
        refreshCookie.setAttribute("SameSite", "Lax");
        response.addCookie(refreshCookie);
    }

    /**
     * Extract session_id from the refresh_token HttpOnly cookie.
     * Returns null if cookie is missing or token doesn't contain session_id.
     */
    private UUID extractSessionIdFromCookie(HttpServletRequest request) {
        Cookie refreshCookie = WebUtils.getCookie(request, "refresh_token");
        if (refreshCookie == null || refreshCookie.getValue() == null) {
            return null;
        }
        return jwtUtils.extractSessionId(refreshCookie.getValue());
    }
}
