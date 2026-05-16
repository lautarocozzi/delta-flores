# Backend: Auth — Frontend Role Check Bug Fix

## Purpose

Fix the frontend role check in `PlantasPage.tsx` where `user?.role === "SUPER_ADMIN"` does not match the backend's `ROLE_SUPER_ADMIN` value, and ensure the CepaService admin bypass is consistent across all role checks.

## Requirements

### R-AUTH-001: Fix Frontend SUPER_ADMIN Role Check

The `PlantasPage.tsx` currently checks:

```typescript
const isSuperAdmin = user?.role === "SUPER_ADMIN";
```

This MUST be changed to either:

```typescript
const isSuperAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";
```

Or, better, import the role values from the backend enum (via the Zod schema at `DTOSchemas.ts` where `rol` is `z.enum(['GROWER', 'ADMIN', 'SUPER_ADMIN'])`).

The fix MUST check for both `"SUPER_ADMIN"` AND `"ADMIN"` since the backend `GET /api/plantas/user/{userId}` endpoint uses `@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")`.

#### Scenario: ADMIN user sees user selector

- GIVEN a user with role "ADMIN" (UserDtoSchema validates this)
- WHEN they view PlantasPage
- THEN the admin user selector dropdown IS visible
- AND they can select other users to view their plants

#### Scenario: GROWER user does NOT see user selector

- GIVEN a user with role "GROWER"
- WHEN they view PlantasPage
- THEN the admin user selector is NOT visible

### R-AUTH-002: Verify Frontend Role Constant Consistency

The `UserDtoSchema` in `DTOSchemas.ts` currently defines:

```typescript
rol: z.enum(['GROWER', 'ADMIN', 'SUPER_ADMIN'])
```

This schema MUST be verified correct and maintained. The frontend MUST NOT use hardcoded string comparisons against role values — SHOULD use the schema-driven type.

#### Scenario: Zod schema drives role check

- GIVEN the UserDtoSchema defines `rol` as enum
- WHEN a role comparison is needed
- THEN the code MUST use the type from the schema, not a raw string literal
- AND the fix in R-AUTH-001 is the minimum acceptable change
