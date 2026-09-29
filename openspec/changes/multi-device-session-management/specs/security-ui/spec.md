# Security UI Specification

## Purpose

Frontend Security section in EditProfileDialog. Displays active sessions with device metadata and provides revoke actions for multi-device security control.

## Requirements

### Requirement: Security Section in EditProfileDialog

The system SHALL render a "Security" section/tab inside the existing EditProfileDialog, alongside Profile and Preferences.

#### Scenario: Section visible

- GIVEN a user opens EditProfileDialog
- WHEN the dialog renders
- THEN a "Security" section is visible with a session list

### Requirement: Session List Display

Each session entry SHALL show: device info (parsed from user-agent), IP address, relative timestamp ("5 min ago"), and a "Current" badge for the active session.

#### Scenario: Multiple sessions

- GIVEN sessions from Chrome/Windows, Safari/iPhone, Firefox/Linux
- WHEN the Security section loads
- THEN 3 entries render with device icon, IP, relative time
- AND the current device has a "Current" badge

#### Scenario: Loading state

- GIVEN session data is fetching
- WHEN the section mounts
- THEN a skeleton loader is shown

#### Scenario: Empty state

- GIVEN only one session exists (current)
- WHEN the section loads
- THEN "No other active sessions" is displayed

### Requirement: Revoke Single Session

Each non-current session entry SHALL have a "Revoke" button calling `DELETE /api/auth/sessions/{id}` with optimistic cache removal.

#### Scenario: Revoke succeeds

- GIVEN session B is listed
- WHEN user clicks "Revoke" on B
- THEN B is removed from the list optimistically
- AND a success toast: "Session revoked"

#### Scenario: Revoke fails

- GIVEN the API returns an error
- WHEN the mutation fails
- THEN B remains in the list
- AND error toast: "Failed to revoke session. Try again."

### Requirement: Revoke All Other Sessions

A "Close all other sessions" button SHALL call `DELETE /api/auth/sessions`. Requires confirmation dialog.

#### Scenario: Confirm and revoke all

- GIVEN 3+ sessions exist
- WHEN user clicks "Close all other sessions"
- THEN confirmation dialog: "This will sign you out of all other devices. Continue?"
- AND on confirm, non-current sessions are removed from the list
- AND success toast: "All other sessions closed"

#### Scenario: Button hidden when alone

- GIVEN only the current session exists
- WHEN the section loads
- THEN the button is disabled or hidden

### Requirement: TypeScript Session Types

The frontend SHALL define `SessionResponse` interface (`id`, `deviceInfo`, `ipAddress`, `userAgent`, `lastActive`, `createdAt`, `isCurrent`) and type `session_id` in login/refresh response types.

#### Scenario: Types compile

- GIVEN the frontend builds
- WHEN TypeScript checks run
- THEN no type errors related to session types

### Requirement: React Query Integration

Session data SHALL use a `useSessions` hook via React Query. Mutations SHALL use `useMutation` with cache invalidation on success.

#### Scenario: Cache invalidation on revoke

- GIVEN session list is cached
- WHEN a session is revoked successfully
- THEN the list query is invalidated and refetched

#### Scenario: Cache invalidation on revoke-all

- GIVEN 4 cached entries
- WHEN "Close all other sessions" succeeds
- THEN refetch shows only 1 entry (current)

## Non-Functional Requirements

- **Responsive**: Stacked on mobile, table/card on desktop.
- **Accessibility**: Revoke buttons have `aria-label` (e.g., "Revoke Chrome on Windows session").
- **Performance**: Session list loads in < 1s on 4G. Single API call only.
