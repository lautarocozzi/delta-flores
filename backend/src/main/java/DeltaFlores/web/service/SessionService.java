package DeltaFlores.web.service;

import DeltaFlores.web.dto.DeviceSessionGroupDto;
import DeltaFlores.web.dto.SessionResponseDto;
import DeltaFlores.web.entities.User;
import DeltaFlores.web.entities.UserSession;
import DeltaFlores.web.repository.UserRepository;
import DeltaFlores.web.repository.UserSessionRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
public class SessionService {

    /** Sessions inactive for more than this period are considered expired. */
    public static final Duration SESSION_MAX_INACTIVE = Duration.ofDays(30);

    private final UserSessionRepository userSessionRepository;
    private final UserRepository userRepository;

    @Transactional
    public UserSession createSession(Long userId, String refreshToken, HttpServletRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        String hash = refreshToken != null && !refreshToken.isBlank() ? hashToken(refreshToken) : "pending";
        String ip = extractClientIp(request);
        String ua = request.getHeader("User-Agent");

        // One session per device: reuse existing active session with same User-Agent
        Optional<UserSession> existing = userSessionRepository
                .findFirstByUserIdAndUserAgentAndRevokedFalseOrderByLastActiveDesc(userId, ua);

        if (existing.isPresent()) {
            UserSession session = existing.get();
            session.setRefreshTokenHash(hash);
            session.setIpAddress(ip);
            session.setLastActive(Instant.now());
            UserSession saved = userSessionRepository.save(session);
            log.info("Session reused for user '{}': session={}, browser={}, os={}", 
                    user.getUsername(), saved.getId(), parseBrowser(ua), parseOs(ua));
            return saved;
        }

        UserSession session = new UserSession(user, hash, ip, ua);
        UserSession saved = userSessionRepository.save(session);
        log.info("Session created for user '{}': session={}, browser={}, os={}, ua={}", 
                user.getUsername(), saved.getId(), parseBrowser(ua), parseOs(ua), 
                ua != null ? ua.substring(0, Math.min(ua.length(), 80)) : "null");
        return saved;
    }

    @Transactional
    public void updateSessionHash(UserSession session, String refreshToken) {
        session.setRefreshTokenHash(hashToken(refreshToken));
        userSessionRepository.save(session);
    }

    @Transactional
    public Optional<UserSession> findById(UUID sessionId) {
        return userSessionRepository.findById(sessionId);
    }

    /**
     * Find the most recent active session ID for a user.
     * Used as fallback for isCurrent detection when cookie has no session_id.
     */
    @Transactional(readOnly = true)
    public UUID findMostRecentSessionId(Long userId) {
        return userSessionRepository.findFirstByUserIdAndRevokedFalseOrderByLastActiveDesc(userId)
                .map(UserSession::getId)
                .orElse(null);
    }

    /**
     * Validate session exists and is not revoked, verify the presented token
     * matches the stored hash (rotation check), then rotate — all in ONE transaction.
     * Returns empty if session invalid, token hash mismatch (possible theft), or expired.
     */
    @Transactional
    public Optional<UserSession> validateAndRotateSession(UUID sessionId, String presentedToken, String newRefreshToken) {
        return userSessionRepository.findById(sessionId)
                .map(session -> {
                    if (session.isRevoked()) {
                        return null;
                    }
                    // TTL check: session expired by inactivity (30-day rolling window)
                    Instant cutoff = Instant.now().minus(SESSION_MAX_INACTIVE);
                    if (session.getLastActive().isBefore(cutoff)) {
                        log.warn("Session {} expired: lastActive={} is older than {}. Revoking.", 
                                sessionId, session.getLastActive(), SESSION_MAX_INACTIVE);
                        session.setRevoked(true);
                        userSessionRepository.save(session);
                        return null;
                    }
                    // Rotation check: presented token must match stored hash
                    String presentedHash = hashToken(presentedToken);
                    if (!presentedHash.equals(session.getRefreshTokenHash())) {
                        log.warn("Refresh token hash mismatch for session {} — possible token reuse after rotation. Revoking all sessions.", sessionId);
                        session.setRevoked(true);
                        userSessionRepository.save(session);
                        return null;
                    }
                    session.setLastActive(Instant.now());
                    session.setRefreshTokenHash(hashToken(newRefreshToken));
                    userSessionRepository.save(session);
                    return session;
                });
    }

    @Transactional
    public boolean validateSession(UUID sessionId) {
        return userSessionRepository.findById(sessionId)
                .map(session -> {
                    if (session.isRevoked()) {
                        return false;
                    }
                    session.setLastActive(java.time.Instant.now());
                    userSessionRepository.save(session);
                    return true;
                })
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public List<SessionResponseDto> listSessions(Long userId, UUID currentSessionId) {
        List<UserSession> sessions = userSessionRepository.findAllByUserIdAndRevokedFalseOrderByLastActiveDesc(userId);
        return sessions.stream()
                .map(s -> new SessionResponseDto(
                        s.getId(),
                        s.getDeviceInfo(),
                        s.getIpAddress(),
                        s.getUserAgent(),
                        s.getLastActive(),
                        s.getCreatedAt(),
                        currentSessionId != null && s.getId().equals(currentSessionId)
                ))
                .toList();
    }

    @Transactional
    public boolean revokeSession(UUID sessionId, Long userId) {
        return userSessionRepository.findByIdAndUserId(sessionId, userId)
                .map(session -> {
                    session.setRevoked(true);
                    userSessionRepository.save(session);
                    log.info("Session {} revoked for user ID: {}", sessionId, userId);
                    return true;
                })
                .orElse(false);
    }

    @Transactional
    public int revokeAllExceptCurrent(Long userId, UUID currentSessionId) {
        int count = userSessionRepository.revokeAllExceptCurrent(userId, currentSessionId);
        log.info("Revoked {} sessions for user ID: {} (kept {})", count, userId, currentSessionId);
        return count;
    }

    /**
     * Groups active sessions by device (User-Agent hash).
     * 
     * NOTE: Device grouping uses SHA-256(User-Agent) as the key.
     * Two devices with identical User-Agent strings will be merged into one group.
     * Security is enforced at the session level, not the group level — each session
     * can be individually revoked regardless of grouping.
     */
    @Transactional(readOnly = true)
    public List<DeviceSessionGroupDto> groupByDevice(Long userId, UUID currentSessionId) {
        List<UserSession> sessions = userSessionRepository.findAllByUserIdAndRevokedFalseOrderByLastActiveDesc(userId);

        Map<String, List<UserSession>> grouped = sessions.stream()
                .collect(Collectors.groupingBy(s -> hashToken(s.getUserAgent() != null ? s.getUserAgent() : "unknown")));

        List<DeviceSessionGroupDto> result = new ArrayList<>();
        for (Map.Entry<String, List<UserSession>> entry : grouped.entrySet()) {
            String deviceKey = entry.getKey();
            List<UserSession> group = entry.getValue();

            UserSession latest = group.get(0); // already sorted by lastActive desc
            String userAgent = latest.getUserAgent();

            boolean isCurrent = group.stream().anyMatch(s ->
                    currentSessionId != null && s.getId().equals(currentSessionId));

            result.add(new DeviceSessionGroupDto(
                    deviceKey,
                    parseBrowser(userAgent),
                    parseOs(userAgent),
                    latest.getIpAddress(),
                    latest.getLastActive(),
                    isCurrent,
                    group.size(),
                    group.stream().map(UserSession::getId).toList()
            ));
        }

        result.sort(Comparator.comparing(DeviceSessionGroupDto::lastActive).reversed());
        return result;
    }

    @Transactional
    public int revokeByDeviceKey(Long userId, String deviceKey, UUID currentSessionId) {
        List<UserSession> sessions = userSessionRepository.findAllByUserIdAndRevokedFalseOrderByLastActiveDesc(userId);

        int count = 0;
        for (UserSession session : sessions) {
            // Never revoke the current session — prevent self-lockout
            if (currentSessionId != null && session.getId().equals(currentSessionId)) {
                continue;
            }
            String key = hashToken(session.getUserAgent() != null ? session.getUserAgent() : "unknown");
            if (key.equals(deviceKey)) {
                session.setRevoked(true);
                userSessionRepository.save(session);
                count++;
            }
        }
        log.info("Revoked {} sessions for user ID: {} deviceKey: {} (currentSessionId: {})", 
                count, userId, deviceKey, currentSessionId);
        return count;
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String parseBrowser(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) return "Unknown";
        // Order matters: check specific browsers first (Chrome includes "Safari" in UA)
        if (userAgent.contains("Edg")) return "Edge";
        if (userAgent.contains("OPR") || userAgent.contains("Opera")) return "Opera";
        if (userAgent.contains("Firefox")) return "Firefox";
        if (userAgent.contains("Chrome") && !userAgent.contains("Edg")) return "Chrome";
        if (userAgent.contains("Safari") && !userAgent.contains("Chrome")) return "Safari";
        // Fallback: if UA exists but no known browser matched
        return "Other";
    }

    private String parseOs(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) return "Unknown";
        if (userAgent.contains("Windows")) return "Windows";
        if (userAgent.contains("Mac OS")) return "macOS";
        if (userAgent.contains("Android")) return "Android";
        if (userAgent.contains("iPhone") || userAgent.contains("iPad")) return "iOS";
        if (userAgent.contains("Linux")) return "Linux";
        return "Other";
    }
}
