# Design: Multi-Device Session Management

## Technical Approach

Add a `UserSession` entity tracked server-side. On login, create a session row. On `/api/auth/refresh`, validate session is not revoked and update `last_active`. Embed `session_id` UUID claim in refresh token. Expose 3 REST endpoints for listing and revoking sessions. Frontend adds a Security section to `EditProfileDialog` with React Query hooks and optimistic updates.

## Architecture Decisions

### Decision: Session entity uses UUID PK

| Option | Tradeoff | Decision |
|--------|----------|----------|
| UUID PK | Globally unique, safe to embed in JWT, no sequential leak | ✅ Chosen |
| Long identity | Matches User.id pattern, but leaks count, risky in token claims | Rejected |

**Rationale**: Session IDs travel inside JWT claims. UUIDs prevent token forgery via sequential guessing and avoid cross-table ID confusion.

### Decision: Hibernate auto-DDL (no Flyway)

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Hibernate `ddl-auto=update` | Already configured, zero migration infra needed | ✅ Chosen |
| Add Flyway | Proper migration control, but project has no migration history | Rejected |

**Rationale**: The project uses `spring.jpa.hibernate.ddl-auto=update` across all entities. Adding Flyway for a single change creates migration debt. Hibernate handles the new table cleanly.

### Decision: Session creation inside JwtAuthenticationFilter

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Inject SessionService into filter, create in `successfulAuthentication` | Tight coupling to filter, but login is the ONLY place refresh token is created | ✅ Chosen |
| Create session in AuthController | Refresh endpoint doesn't create new refresh tokens, only access tokens | Rejected |

**Rationale**: The refresh token is only generated during login (in `successfulAuthentication`). The `/api/auth/refresh` endpoint only regenerates the access token. Session must be created where the refresh token is born.

### Decision: No refresh token rotation

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Keep refresh token, rotate access token only | Simpler, existing behavior, 7-day refresh lifetime | ✅ Chosen |
| Rotate refresh token on every refresh | More secure but breaks multi-tab, adds complexity | Rejected |

**Rationale**: Current system doesn't rotate refresh tokens. Adding rotation would break the existing BroadcastChannel multi-tab sync and require more complex cookie management. Revocation via session flag provides equivalent security.

### Decision: Legacy token backward compatibility

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Skip session validation for tokens without `session_id` claim | Graceful degradation, no forced re-login on deploy | ✅ Chosen |
| Force all tokens to have session_id | Cleaner, but forces re-login for all users | Rejected |

**Rationale**: Existing refresh tokens (7-day lifetime) lack `session_id`. Forcing re-login on deploy is a poor UX. Legacy tokens expire naturally within 7 days.

## Data Flow

```
Login (JwtAuthenticationFilter.successfulAuthentication)
  │
  ├─ Generate access + refresh tokens (session_id embedded in refresh)
  ├─ INSERT user_sessions row (hash, IP, user-agent, user_id)
  └─ Set refresh_token HttpOnly cookie

Refresh (AuthController.refreshToken)
  │
  ├─ Read session_id from refresh token claims
  ├─ SELECT user_sessions WHERE id=session_id AND revoked=false
  │    ├─ NOT FOUND → 401 "Session revoked"
  │    └─ FOUND → UPDATE last_active, return new access token
  └─ (Legacy: no session_id claim → skip validation, proceed as before)

List Sessions (GET /api/auth/sessions)
  │
  ├─ Extract user_id from access token
  ├─ SELECT user_sessions WHERE user_id=? AND revoked=false ORDER BY last_active DESC
  └─ Return list with isCurrent flag

Revoke Session (DELETE /api/auth/sessions/{id})
  │
  ├─ Extract user_id from access token
  ├─ UPDATE user_sessions SET revoked=true WHERE id=? AND user_id=?
  └─ Return 200 / 404 (if not owned)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/.../entity/UserSession.java` | Create | JPA entity: UUID id, user_id FK, deviceInfo, ipAddress, userAgent, refreshTokenHash, lastActive, createdAt, revoked |
| `backend/.../repository/UserSessionRepository.java` | Create | Queries: findByRefreshTokenHash, findByIdAndUserId, findAllByUserIdAndRevokedFalse, revokeByUserIdExcept |
| `backend/.../service/SessionService.java` | Create | createSession(), validateSession(), listSessions(), revokeSession(), revokeAllExceptCurrent() |
| `backend/.../controller/AuthController.java` | Modify | Add 3 session endpoints. Inject SessionService. Add session_id to refresh response. |
| `backend/.../security/JwtUtils.java` | Modify | Add `generateRefreshToken(userDetails, sessionId)` overload embedding session_id claim. Add `extractSessionId()`. |
| `backend/.../security/JwtAuthenticationFilter.java` | Modify | Inject SessionService. In `successfulAuthentication`, create session and pass sessionId to `generateRefreshToken`. |
| `backend/.../security/WebSecurityConfig.java` | Modify | Inject SessionService, pass to JwtAuthenticationFilter. Add `/api/auth/sessions` to authenticated endpoints. |
| `frontend/src/interfaces/Planta.ts` | Modify | Add `SessionResponse` type export |
| `frontend/src/schemas/DTOSchemas.ts` | Modify | Add SessionResponse Zod schema |
| `frontend/src/services/api.ts` | Modify | Add `getSessions()`, `revokeSession(id)`, `revokeAllSessions()` |
| `frontend/src/hooks/useSessions.ts` | Create | React Query `useSessions` hook + revoke mutations |
| `frontend/src/components/profile/SecuritySection.tsx` | Create | Session list, revoke buttons, revoke-all with confirmation |
| `frontend/src/components/profile/EditProfileDialog.tsx` | Modify | Add Security section with separator |

## Interfaces / Contracts

### Backend DTO

```java
// SessionResponseDto
public record SessionResponseDto(
    UUID id,
    String deviceInfo,
    String ipAddress,
    String userAgent,
    Instant lastActive,
    Instant createdAt,
    boolean isCurrent
) {}
```

### Refresh token claims (new)

```json
{
  "sub": "user@email.com",
  "user_id": 42,
  "user_role": "ROLE_GROWER",
  "token_type": "refresh",
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Frontend TypeScript

```typescript
interface SessionResponse {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  userAgent: string;
  lastActive: string; // ISO 8601
  createdAt: string;
  isCurrent: boolean;
}
```

## Security Considerations

- **Token hash**: Store SHA-256 of refresh token, never plaintext. Lookup by hash on refresh.
- **Ownership check**: All session queries filter by `user_id` from JWT. Revoke returns 404 for non-owned (no user enumeration).
- **IP/UA**: Parsed from `X-Forwarded-For` (proxy) or `request.getRemoteAddr()`. User-agent from header. Audit-only, not validated.
- **Rate limiting**: Not in scope for initial implementation. Session endpoints are authenticated (requires valid JWT).

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | SessionService: create, validate, list, revoke | Mock repository, test business logic |
| Integration | AuthController endpoints, JWT session_id claims | MockMvc + test database |
| E2E | Login creates session, refresh validates, revoke blocks refresh | Selenium/Playwright with real DB |

## Migration / Rollout

No manual migration needed. Hibernate `ddl-auto=update` creates `user_sessions` table on first startup. Existing tokens without `session_id` continue to work (legacy fallback). After 7 days, all legacy tokens expire naturally.

## Open Questions

- [ ] Should the session endpoint paths be `/api/auth/sessions` (current plan) or `/api/sessions`? Current auth endpoints are under `/api/auth/`.
- [ ] Should device info parsing (user-agent → "Chrome on Windows") happen server-side or frontend-side? Proposal suggests frontend parsing.
