# Backend: Cepas — abreviatura Field and Admin Bypass

## Purpose

Add an `abreviatura` (abbreviation) field to `Cepa` for use in auto-generated `ubicacion` strings (e.g., "OGK-Z1-C2-F1"), and add an admin bypass to `CepaService.getCepasForCurrentUser()` so ADMIN/SUPER_ADMIN users see ALL cepas in the system instead of only their own.

## Requirements

### R-CEPA-001: abreviatura Field on Cepa Entity

The `Cepa` entity MUST be extended with:

| Field | Type | Constraints |
|-------|------|-------------|
| abreviatura | String | NOT NULL, max 10 chars, unique per user |

- The column name in the database MUST be `abreviatura`.
- MUST be required (NOT NULL) — existing seed data and new cepas MUST include it.
- The `CepaDto` MUST include `abreviatura` as a required field.

#### Scenario: Create Cepa with abreviatura

- GIVEN a valid Cepa creation request
- WHEN the payload includes `"abreviatura": "OGK"`
- THEN the Cepa is created
- AND `abreviatura` is stored as "OGK"

#### Scenario: Create Cepa without abreviatura fails

- GIVEN a Cepa creation request
- WHEN `abreviatura` is missing or empty
- THEN the operation MUST fail with a validation error
- AND the entity is NOT persisted

#### Scenario: Duplicate abreviatura for same user

- GIVEN a user already has a Cepa with `abreviatura = "OGK"`
- WHEN the same user tries to create another Cepa with `abreviatura = "OGK"`
- THEN the operation MUST fail (unique per user constraint)

### R-CEPA-002: abreviatura in CepaDto

The `CepaDto` MUST include:

```java
@NotNull
private String abreviatura;
```

- The frontend Zod schema MUST be updated to require `abreviatura` (non-empty string, max 10 chars).

### R-CEPA-003: DtoMapper abreviatura Mapping

- `cepaToCepaDto`: MUST map `cepa.getAbreviatura()` to `cepaDto.setAbreviatura()`.
- `cepaDtoToCepa`: MUST map `cepaDto.getAbreviatura()` to `cepa.setAbreviatura()`.

### R-CEPA-004: Admin Bypass for getCepasForCurrentUser()

The current `CepaService.getCepasForCurrentUser()` ONLY returns cepas owned by the current user, even for ADMIN and SUPER_ADMIN roles. This is inconsistent with `PlantaService.getAllPlantas()` and `SalaService.getAllSalas()`, which return ALL records for admin users.

The method MUST be modified to:

```java
if (isAdmin) {
    return cepaRepository.findAll()  // all cepas
} else {
    return cepaRepository.findByUserId(currentUser.getId())  // only own
}
```

Using the same `isAdmin` pattern already established in `PlantaService`:
```java
boolean isAdmin = authentication.getAuthorities().stream()
    .anyMatch(role -> role.getAuthority().equals("ROLE_ADMIN") || role.getAuthority().equals("ROLE_SUPER_ADMIN"));
```

#### Scenario: ADMIN sees all cepas

- GIVEN a user with ROLE_ADMIN and 3 cepas of their own, plus 10 cepas from other users
- WHEN they call GET `/api/cepas`
- THEN all 13 cepas are returned
- AND the response includes cepas from other users with their `userId` correctly populated

#### Scenario: GROWER sees only own cepas

- GIVEN a user with ROLE_GROWER and 3 cepas of their own
- WHEN they call GET `/api/cepas`
- THEN only their 3 cepas are returned

#### Scenario: SUPER_ADMIN sees all cepas

- GIVEN a SUPER_ADMIN user
- WHEN they call GET `/api/cepas`
- THEN ALL cepas in the system are returned
- AND the behavior is identical to ADMIN

### R-CEPA-005: CepaRepository findAll Variants

No repository changes are needed — `findAll()` is already provided by JpaRepository. The `getCepasForCurrentUser()` service method will use it conditionally.

### R-CEPA-006: Backward Compatibility

- Existing Cepas without `abreviatura` in production MUST be handled (either by migration script or by making the field allow a grace period).
- Since `ddl-auto=update` is used, the column will be added as nullable first, then a data migration must fill existing rows, then a not-null constraint is applied.

#### Scenario: Existing cepa without abreviatura

- GIVEN existing Cepas in the database with `abreviatura = NULL`
- WHEN the application starts with ddl-auto=update
- THEN the column is added as nullable
- AND a manual SQL or script fills the missing values
- AND after the migration, the column is set to NOT NULL
