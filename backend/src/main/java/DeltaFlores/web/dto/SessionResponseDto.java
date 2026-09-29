package DeltaFlores.web.dto;

import java.time.Instant;
import java.util.UUID;

public record SessionResponseDto(
        UUID id,
        String deviceInfo,
        String ipAddress,
        String userAgent,
        Instant lastActive,
        Instant createdAt,
        boolean isCurrent
) {}
