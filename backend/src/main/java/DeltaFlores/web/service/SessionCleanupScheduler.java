package DeltaFlores.web.service;

import DeltaFlores.web.entities.UserSession;
import DeltaFlores.web.repository.UserSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Scheduled task that purges expired sessions from the database.
 * Runs daily at 03:00 UTC to clean up sessions inactive for more than30 days.
 * 
 * This complements the lazy TTL check in SessionService.validateAndRotateSession():
 * - Lazy: catches expiry when the device tries to refresh → immediate 401
 * - Scheduled: cleans up orphaned sessions that never attempted refresh
 */
@Service
@RequiredArgsConstructor
@Log4j2
public class SessionCleanupScheduler {

    private final UserSessionRepository userSessionRepository;

    /**
     * Purge sessions inactive for more than30 days.
     * Runs daily at 03:00 UTC (off-peak for Argentina timezone).
     */
    @Scheduled(cron = "0 0 3 * * *", zone = "UTC")
    @Transactional
    public void purgeExpiredSessions() {
        Instant cutoff = Instant.now().minus(SessionService.SESSION_MAX_INACTIVE);
        List<UserSession> expired = userSessionRepository.findAllByRevokedFalseAndLastActiveBefore(cutoff);

        if (expired.isEmpty()) {
            log.debug("Session cleanup: no expired sessions found");
            return;
        }

        for (UserSession session : expired) {
            session.setRevoked(true);
            userSessionRepository.save(session);
        }

        log.info("Session cleanup: revoked {} expired sessions (lastActive before {})", 
                expired.size(), cutoff);
    }
}
