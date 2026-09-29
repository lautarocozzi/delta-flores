package DeltaFlores.web.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Getter
@Setter
@Table(name = "user_sessions", indexes = {
        @Index(name = "idx_user_sessions_hash_revoked", columnList = "refreshTokenHash, revoked")
})
public class UserSession {

    @Id
    private UUID id = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 64)
    private String refreshTokenHash;

    @Column(length = 255)
    private String deviceInfo;

    @Column(length = 45)
    private String ipAddress;

    @Column(length = 512)
    private String userAgent;

    @Column(nullable = false)
    private boolean revoked = false;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant lastActive;

    public UserSession() {
    }

    public UserSession(User user, String refreshTokenHash, String ipAddress, String userAgent) {
        this.user = user;
        this.refreshTokenHash = refreshTokenHash;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.deviceInfo = parseDeviceInfo(userAgent);
    }

    private String parseDeviceInfo(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) {
            return "Unknown device";
        }
        // Simple heuristic: extract first meaningful segment
        if (userAgent.contains("Chrome")) return "Chrome";
        if (userAgent.contains("Firefox")) return "Firefox";
        if (userAgent.contains("Safari") && !userAgent.contains("Chrome")) return "Safari";
        if (userAgent.contains("Edge")) return "Edge";
        if (userAgent.contains("Opera") || userAgent.contains("OPR")) return "Opera";
        return "Other browser";
    }
}
