# Proposal: Multi-Device Session Management

## Intent

Users currently have no visibility into where their account is logged in. If a token is compromised or left on a shared computer, there's no way to detect or revoke access. This change adds server-side session tracking and a Security UI so users can audit and control active sessions across devices.

## Scope

### In Scope
- `user_sessions` JPA entity + PostgreSQL table (device info, IP, user agent, last_active, refresh token hash, revocation flag)
- Session creation on login and refresh (background tracking, no new endpoints required for creation)
- `GET /api/auth/sessions` — list active sessions for current user
- `DELETE /api/auth/sessions/{id}` — revoke a single session
- `DELETE /api/auth/sessions` — revoke all sessions except current
- Refresh token rotation tied to session: each refresh updates `last_active` and validates session is not revoked
- Frontend: "Security" tab/section in EditProfileDialog with active sessions list, revoke buttons
- Typing the login/refresh response types properly in the frontend

### Out of Scope
- Push notifications for new logins
- Device fingerprinting or geolocation
- Session limits (max N devices)
- Admin-level session management (super admin dashboard)
- MFA / 2FA

## Capabilities

### New Capabilities
- `session-management`: Server-side session tracking, CRUD operations, token-to-session binding, revocation logic
- `security-ui`: Frontend Security section in profile dialog — session list, revoke actions, responsive layout

### Modified Capabilities
None — no existing specs in `openspec/specs/` to modify.

## Approach

**Backend**: Add `UserSession` entity mapped to `user_sessions` table. On login, create a session row. On `/api/auth/refresh`, look up the session by a session identifier embedded in the refresh token (or by matching the refresh token hash), update `lastActive`, and reject if revoked. Expose 3 endpoints under `/api/auth/sessions` scoped to the authenticated user. Soft-delete via `revoked = true`.

**Frontend**: Add a `SecuritySection` component inside `EditProfileDialog`. Fetch sessions via React Query `useQuery`. Revoke actions use `useMutation` with optimistic cache invalidation. Type `LoginResponse` and `RefreshResponse` interfaces in `src/types/auth.ts`.

**Token handling**: Embed a `session_id` claim in the refresh token. The session ID links the token to the DB row without storing the token itself — store only a SHA-256 hash for lookup.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/main/java/.../entity/UserSession.java` | New | JPA entity for session tracking |
| `backend/src/main/java/.../repository/UserSessionRepository.java` | New | Repository with custom queries |
| `backend/src/main/java/.../service/SessionService.java` | New | Business logic for session CRUD |
| `backend/src/main/java/.../controller/AuthController.java` | Modified | New session endpoints, create session on login |
| `backend/src/main/java/.../security/JwtTokenProvider.java` | Modified | Embed session_id in refresh token |
| `backend/src/main/resources/application.yml` | Modified | Session table config if needed |
| `frontend/src/types/auth.ts` | Modified | Proper typing for login/refresh responses |
| `frontend/src/components/EditProfileDialog.tsx` | Modified | Add Security section |
| `frontend/src/components/SecuritySection.tsx` | New | Active sessions list + revoke UI |
| `frontend/src/hooks/useSessions.ts` | New | React Query hooks for session API |
| DB migration | New | `user_sessions` table + index |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Refresh token rotation breaks existing sessions on deploy | Medium | Migration strategy: existing tokens without session_id are treated as "legacy" and work for one more cycle, then expire naturally |
| `user_sessions` table grows unbounded | Low | Add cleanup job or TTL-based soft delete; sessions older than 30 days with `revoked=true` can be purged |
| Session lookup adds latency to refresh flow | Low | Index on `(refresh_token_hash, revoked)` makes lookup O(1); negligible impact |

## Rollback Plan

1. Remove `UserSession` entity, repository, service, and controller endpoints
2. Remove `session_id` claim from refresh token generation (revert `JwtTokenProvider`)
3. Drop `user_sessions` table via Flyway migration
4. Remove `SecuritySection` component and revert `EditProfileDialog`
5. Revert frontend type changes in `auth.ts`

JWT validation remains backward-compatible — tokens without `session_id` continue to work if the session table is dropped.

## Dependencies

- Existing JWT infrastructure (jjwt 0.11.5) — no new dependencies
- Existing EditProfileDialog — extends, doesn't replace
- Flyway for DB migration management

## Success Criteria

- [ ] `user_sessions` table created with correct schema and indexes
- [ ] Login creates a session row with device info, IP, and hashed token
- [ ] Refresh validates session is not revoked and updates `last_active`
- [ ] `GET /api/auth/sessions` returns only current user's active sessions
- [ ] `DELETE /api/auth/sessions/{id}` revokes a single session; subsequent refresh with that session's token is rejected
- [ ] `DELETE /api/auth/sessions` revokes all sessions except current; only the calling session survives
- [ ] Security section renders in EditProfileDialog with list of active devices
- [ ] Revoke button removes a session from the list and invalidates its refresh token
- [ ] "Close all other sessions" button revokes all but current with confirmation dialog
- [ ] Existing login/refresh flow is unaffected for users without active sessions
