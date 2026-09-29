package DeltaFlores.web.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Device-grouped session response for the active sessions UI.
 * 
 * KNOWN LIMITATION: deviceKey is SHA-256(User-Agent). Two devices with
 * identical User-Agent strings (e.g., same Chrome version on same OS)
 * will be merged into one group. This is acceptable because:
 * - Security is enforced at the session level (each session is independently revocable)
 * - The grouping is purely for display purposes
 * - A future enhancement could use a per-device UUID stored in localStorage
 */
public record DeviceSessionGroupDto(
        String deviceKey,
        String browser,
        String os,
        String ipAddress,
        Instant lastActive,
        boolean isCurrent,
        int sessionCount,
        List<UUID> sessionIds
) {}
