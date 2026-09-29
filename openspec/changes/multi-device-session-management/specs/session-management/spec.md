# Session Management Specification

## Purpose

Server-side tracking of user authentication sessions. Binds each refresh token to a DB record so sessions can be listed, audited, and revoked across devices.

## Requirements

### Requirement: Session Entity

The system SHALL persist a `user_sessions` table: `id` (UUID PK), `user_id` (FK), `device_info`, `ip_address`, `user_agent`, `refresh_token_hash` (SHA-256, unique), `last_active`, `created_at`, `revoked` (boolean, default false). SHALL have an index on `(refresh_token_hash, revoked)`.

#### Scenario: Session created on login

- GIVEN a user authenticates via `/api/auth/login`
- WHEN the refresh token is generated
- THEN a `user_sessions` row is created with IP, user-agent, SHA-256 hash
- AND `revoked` is false, timestamps are set

#### Scenario: Session created on registration

- GIVEN a new user registers via `/api/auth/register`
- WHEN the refresh token is generated
- THEN a session row is created identically to the login flow

### Requirement: Session ID in Refresh Token

The system SHALL embed a `session_id` claim (UUID) in the refresh token. Tokens without this claim (pre-change) SHALL be treated as legacy and proceed without session validation.

#### Scenario: Refresh token contains session_id

- GIVEN a session with id `abc-123`
- WHEN the refresh token is generated
- THEN the token payload includes `"session_id": "abc-123"`

#### Scenario: Legacy token without session_id

- GIVEN a refresh token issued before this change (no `session_id`)
- WHEN refresh is requested
- THEN refresh proceeds normally with no session validation

### Requirement: Session Validation on Refresh

The system SHALL look up the session by `session_id` from the token on every `/api/auth/refresh` call.

#### Scenario: Valid session refresh

- GIVEN session `X` with `revoked=false`
- WHEN a refresh arrives with `session_id=X`
- THEN `last_active` is updated and a new token is issued with the same `session_id`

#### Scenario: Revoked session rejected

- GIVEN session `X` with `revoked=true`
- WHEN a refresh arrives with `session_id=X`
- THEN HTTP 401 is returned with `{"error": "Session revoked"}`

#### Scenario: Unknown session rejected

- GIVEN no session exists with `id=X`
- WHEN a refresh arrives with `session_id=X`
- THEN HTTP 401 is returned

### Requirement: List Sessions

`GET /api/auth/sessions` SHALL return all non-revoked sessions for the authenticated user, ordered by `last_active` desc. Each item includes `id`, `deviceInfo`, `ipAddress`, `userAgent`, `lastActive`, `createdAt`, `isCurrent` (true if `id` matches the requesting session).

#### Scenario: List shows only active sessions

- GIVEN user `U` has sessions A, B, C (active) and D (revoked)
- WHEN `GET /api/auth/sessions` is called from session B
- THEN 3 items are returned (A, B, C) with B marked `isCurrent: true`
- AND D is excluded

#### Scenario: Unauthenticated request

- GIVEN no valid JWT
- WHEN `GET /api/auth/sessions` is called
- THEN HTTP 401 is returned

### Requirement: Revoke Single Session

`DELETE /api/auth/sessions/{id}` SHALL set `revoked=true`. The user MUST own the session.

#### Scenario: Revoke another session

- GIVEN user `U` owns session `X` (not current)
- WHEN `DELETE /api/auth/sessions/X` is called
- THEN `X.revoked` becomes true and subsequent refreshes with `X`'s token are rejected

#### Scenario: Non-owned session

- GIVEN session `X` belongs to user `V`
- WHEN user `U` calls `DELETE /api/auth/sessions/X`
- THEN HTTP 404 is returned (avoids user enumeration)

### Requirement: Revoke All Other Sessions

`DELETE /api/auth/sessions` (no path param) SHALL revoke all sessions except the one from which the request originates.

#### Scenario: Revoke all others

- GIVEN user `U` has sessions A (current), B, C
- WHEN `DELETE /api/auth/sessions` is called from A
- THEN B and C are revoked, A remains active

#### Scenario: Only one session exists

- GIVEN user `U` has only session A
- WHEN `DELETE /api/auth/sessions` is called
- THEN HTTP 200 with zero affected count

## Non-Functional Requirements

- **Performance**: Session lookup on refresh < 5ms (indexed).
- **Security**: Only SHA-256 hashes stored, never plaintext tokens. IP/user-agent for audit only.
- **Retention**: Revoked sessions older than 90 days MAY be purged by cleanup job (out of scope).
