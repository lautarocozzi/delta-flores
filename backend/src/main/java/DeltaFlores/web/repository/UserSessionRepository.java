package DeltaFlores.web.repository;

import DeltaFlores.web.entities.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, UUID> {

    Optional<UserSession> findByRefreshTokenHash(String refreshTokenHash);

    Optional<UserSession> findByIdAndUserId(UUID id, Long userId);

    List<UserSession> findAllByUserIdAndRevokedFalseOrderByLastActiveDesc(Long userId);

    @Modifying
    @Query("DELETE FROM UserSession us WHERE us.user.id = :userId AND us.revoked = true AND us.lastActive < :before")
    int deleteByUserIdAndRevokedTrueAndLastActiveBefore(
            @Param("userId") Long userId,
            @Param("before") Instant before);

    @Modifying
    @Query("UPDATE UserSession us SET us.revoked = true WHERE us.user.id = :userId AND us.id <> :currentSessionId AND us.revoked = false")
    int revokeAllExceptCurrent(
            @Param("userId") Long userId,
            @Param("currentSessionId") UUID currentSessionId);

    /**
     * Find all active sessions (not revoked) that have not been accessed since the given cutoff.
     * Used by the scheduled cleanup task to purge expired sessions.
     */
    List<UserSession> findAllByRevokedFalseAndLastActiveBefore(Instant cutoff);

    /**
     * Count active sessions (not revoked) for a given user.
     */
    long countByUserIdAndRevokedFalse(Long userId);

    /**
     * Find the most recent active session for a user (fallback for isCurrent detection).
     */
    Optional<UserSession> findFirstByUserIdAndRevokedFalseOrderByLastActiveDesc(Long userId);

    /**
     * Find an active session for a specific user and User-Agent.
     * Used to reuse existing sessions instead of creating duplicates per device.
     */
    Optional<UserSession> findFirstByUserIdAndUserAgentAndRevokedFalseOrderByLastActiveDesc(
            Long userId, String userAgent);
}
