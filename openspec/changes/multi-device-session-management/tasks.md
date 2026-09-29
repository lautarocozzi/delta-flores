# Tasks: Multi-Device Session Management

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 430–480 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (backend) → PR 2 (frontend) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Backend: entity, repository, DTO, service, JWT changes, filter wiring, controller endpoints | PR 1 (~245 lines) | Base: main. Includes all session backend logic. |
| 2 | Frontend: types, API client, hooks, SecuritySection, EditProfileDialog integration | PR 2 (~223 lines) | Base: PR 1 branch. Depends on PR 1 endpoints. |

---

## Phase 1: Backend Foundation

- [x] 1.1 Create `backend/src/main/java/DeltaFlores/web/entities/UserSession.java` — JPA entity with UUID PK, `@ManyToOne` to User, `refreshTokenHash`, `revoked`, timestamps. Add `@Index` on `(refresh_token_hash, revoked)`.
- [x] 1.2 Create `backend/src/main/java/DeltaFlores/web/repository/UserSessionRepository.java` — extend `JpaRepository<UserSession, UUID>`. Methods: `findByRefreshTokenHash`, `findByIdAndUserId`, `findAllByUserIdAndRevokedFalseOrderByLastActiveDesc`, `deleteByUserIdAndRevokedTrueAndLastActiveBefore`.
- [x] 1.3 Create `backend/src/main/java/DeltaFlores/web/dto/SessionResponseDto.java` — Java record: `id`, `deviceInfo`, `ipAddress`, `userAgent`, `lastActive`, `createdAt`, `isCurrent`.

**Verify**: Project compiles with new entity/table created by Hibernate on startup.

## Phase 2: Backend Core Logic

- [x] 2.1 Create `backend/src/main/java/DeltaFlores/web/service/SessionService.java` — `createSession(userId, refreshToken, request)`, `validateSession(sessionId)`, `listSessions(userId, currentSessionId)`, `revokeSession(sessionId, userId)`, `revokeAllExceptCurrent(userId, currentSessionId)`. Use `MessageDigest` for SHA-256 hashing.
- [x] 2.2 Modify `backend/src/main/java/DeltaFlores/web/security/JwtUtils.java` — add `generateRefreshToken(UserDetails, UUID sessionId)` overload embedding `session_id` claim. Add `extractSessionId(String token)` method.

**Verify**: Unit-testable: hash matches, token contains session_id claim.

## Phase 3: Backend Wiring

- [x] 3.1 Modify `backend/src/main/java/DeltaFlores/web/security/JwtAuthenticationFilter.java` — inject `SessionService`. In `successfulAuthentication`, call `createSession`, pass `sessionId` to `generateRefreshToken`.
- [x] 3.2 Modify `backend/src/main/java/DeltaFlores/web/security/WebSecurityConfig.java` — inject `SessionService`, pass to filter constructor. Add `/api/auth/sessions/**` to authenticated endpoints.
- [x] 3.3 Modify `backend/src/main/java/DeltaFlores/web/controller/AuthController.java` — inject `SessionService`. Add `GET /api/auth/sessions`, `DELETE /api/auth/sessions/{id}`, `DELETE /api/auth/sessions` (revoke-all). Add session validation in `refreshToken` method: extract `session_id`, call `validateSession`, return 401 if revoked.

**Verify**: `curl` tests — login creates session row, refresh fails with revoked session, list returns user's sessions, revoke returns 404 for non-owned.

## Phase 4: Frontend Foundation

- [x] 4.1 Add `SessionResponse` interface to `frontend/src/interfaces/Planta.ts` (or new `Session.ts` file). Add Zod schema to `frontend/src/schemas/DTOSchemas.ts`.
- [x] 4.2 Add `getSessions()`, `revokeSession(id)`, `revokeAllSessions()` to `frontend/src/services/api.ts`.
- [x] 4.3 Create `frontend/src/hooks/useSessions.ts` — `useSessions()` query hook, `useRevokeSession()` mutation, `useRevokeAllSessions()` mutation with optimistic cache update + `onSuccess` invalidation.

**Verify**: TypeScript compiles cleanly. Hook mocks work in isolation.

## Phase 5: Frontend UI

- [x] 5.1 Create `frontend/src/components/profile/SecuritySection.tsx` — session list with skeleton loader, empty state, "Current" badge, revoke button per non-current session, "Close all other sessions" button with confirmation dialog. Responsive (stacked mobile, card desktop). `aria-label` on revoke buttons.
- [x] 5.2 Modify `frontend/src/components/profile/EditProfileDialog.tsx` — add Security section with separator, render `SecuritySection`.

**Verify**: Open EditProfileDialog → Security tab visible → sessions render → revoke works → revoke-all with confirmation.

## Phase 6: Integration Verification

- [ ] 6.1 End-to-end: login → session created in DB → list shows it → revoke → refresh with revoked token returns 401 → revoke-all leaves only current session.
- [ ] 6.2 Legacy token test: existing refresh token (no `session_id`) still works for refresh, no session validation triggered.

---

## Phase 7: Opción A — One Session Per Device (COMPLETED)

### Architecture Decision
- **Decision**: Opción A — one session per device (reuse existing session with same User-Agent)
- **Rationale**: Eliminates duplicate sessions, makes "Cerrar" button always reliable
- **Date**: 2026-07-26

### Changes Applied

#### 7.1 Backend: Repository Query
- **File**: `UserSessionRepository.java`
- **Change**: Added `findFirstByUserIdAndUserAgentAndRevokedFalseOrderByLastActiveDesc(Long userId, String userAgent)`
- **Purpose**: Find existing active session for same user + User-Agent

#### 7.2 Backend: Session Reuse Logic
- **File**: `SessionService.java`
- **Change**: Modified `createSession()` — before creating new session, check if one exists with same User-Agent. If yes, reuse it (update hash, IP, lastActive). If no, create new.
- **Code**:
  ```java
  Optional<UserSession> existing = userSessionRepository
      .findFirstByUserIdAndUserAgentAndRevokedFalseOrderByLastActiveDesc(userId, ua);
  if (existing.isPresent()) {
      UserSession session = existing.get();
      session.setRefreshTokenHash(hash);
      session.setIpAddress(ip);
      session.setLastActive(Instant.now());
      return userSessionRepository.save(session);
  }
  ```

#### 7.3 Frontend: Optimistic Update Bug Fix
- **File**: `useSessions.ts`
- **Change**: `onMutate` filter now preserves current session: `d.deviceKey !== deviceKey || d.isCurrent`
- **Before**: `old?.filter((d) => d.deviceKey !== deviceKey)` — removed ALL entries with matching deviceKey, including current
- **After**: `old?.filter((d) => d.deviceKey !== deviceKey || d.isCurrent)` — preserves current session

#### 7.4 Frontend: SecuritySection UX Fix
- **File**: `SecuritySection.tsx`
- **Change**: Removed `devices.length === 1 && !hasOtherDevices` shortcut that showed "No hay otros dispositivos conectados" instead of the session card
- **Before**: When only 1 session existed, showed text message instead of session card
- **After**: Always shows session card with "Activa" badge, even when it's the only one. "Cerrar todas" button only appears when other devices exist.

#### 7.5 Frontend: Sidebar Menu
- **File**: `AppSidebar.tsx`
- **Change**: Added "Seguridad" menu item in footer, right below "Mi Perfil"
- **Icon**: Shield from lucide-react
- **Path**: `/profile/security`

### Edge Cases Handled

| Case | Behavior |
|------|----------|
| First login → no existing session | Creates new session ✅ |
| Second login same browser | Reuses existing, updates lastActive ✅ |
| Login from different browser | Creates new (different UA) ✅ |
| Session expired (30 days) | `revoked=true`, not reused, creates new ✅ |
| Token rotation in `validateAndRotateSession` | No changes — rotates hash on existing session ✅ |

### Verification Steps
1. `./mvnw compile` — backend compiles clean ✅
2. `npx tsc --noEmit` — TypeScript compiles clean ✅
3. `docker compose -f docker-compose.dup.yml up -d --build backend1` — Docker rebuilt ✅
4. DB cleaned: `DELETE FROM user_sessions;` (7 phantom sessions removed) ✅

### Next Steps
- End-to-end test in browser
- Commit all changes
