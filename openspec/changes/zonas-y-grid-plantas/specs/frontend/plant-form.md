# Frontend: NewPlantForm Redesign — ZoneGrid Integration and abreviatura in FormularioCepa

## Purpose

Redesign `NewPlantForm.tsx` to replace the free-text `ubicacion` input with the `ZoneGrid` component. When the user selects a Sala, the ZoneGrid loads and displays available zones/cells. Add `abreviatura` field to `FormularioCepa.tsx`.

## Requirements

### R-PF-001: ZoneGrid Replaces ubicacion Input

The current `NewPlantForm.tsx` has:

```tsx
<FormInputField
  control={form.control}
  name="ubicacion"
  label="Ubicación en Sala"
  placeholder="Ej: Estante 2, Esquina izquierda"
  optional
/>
```

This MUST be replaced with the `ZoneGrid` component, placed AFTER the "Espacio / Sala" selector.

#### Scenario: ZoneGrid loads when sala is selected

- GIVEN the user opens NewPlantForm
- WHEN no sala is selected yet
- THEN ZoneGrid shows: "Selecciona una sala para ver las zonas."
- WHEN the user selects Sala #1
- THEN ZoneGrid fetches zonas for Sala #1
- AND renders all zones with their cells

#### Scenario: ZoneGrid updates when sala changes

- GIVEN the user selected Sala #1 and sees Zone A
- WHEN the user changes to Sala #2
- THEN ZoneGrid re-fetches zonas for Sala #2
- AND renders the new zone layout

### R-PF-002: Form Schema Update

The `newPlantSchema` MUST be updated:

- Remove `ubicacion: z.string().optional()`.
- Replace with computed fields that are set on ZoneGrid cell selection:
  ```typescript
  zonaId: z.number().nullable().optional(),
  columnaEnZona: z.number().nullable().optional(),
  filaEnZona: z.number().nullable().optional(),
  ubicacion: z.string().nullable().optional(),
  ```

### R-PF-003: Cepa Selection Enables ZoneGrid

- The ZoneGrid requires `cepaAbreviatura` to generate the ubicacion string.
- The user MUST select a Cepa first (or the form MUST use the selected cepa's abreviatura when computing ubicacion).
- If no Cepa is selected, ZoneGrid cells show generic `???-Z{id}-C{col}-F{fila}` or cells remain unlabeled.

#### Scenario: Cell labels use selected cepa's abreviatura

- GIVEN the user selected Cepa "OG Kush" with abreviatura "OGK"
- WHEN ZoneGrid renders
- THEN each cell label shows `OGK-Z{id}-C{col}-F{fila}`
- WHEN the user changes the cepa selection to "AK-47" with abreviatura "AK"
- THEN cell labels update to `AK-Z{id}-C{col}-F{fila}`

### R-PF-004: Payload includes grid fields

When the form is submitted, the payload MUST include:

```typescript
const payload = {
  // ... existing fields
  zonaId: selectedCell?.zonaId || null,
  columnaEnZona: selectedCell?.columna || null,
  filaEnZona: selectedCell?.fila || null,
  ubicacion: selectedCell?.ubicacion || null,
};
```

#### Scenario: Submit with selected cell

- GIVEN the user selected cell (Zona #1, col 2, fila 3) with ubicacion "OGK-Z1-C2-F3"
- WHEN the form submits
- THEN the payload includes `zonaId: 1`, `columnaEnZona: 2`, `filaEnZona: 3`, `ubicacion: "OGK-Z1-C2-F3"`

### R-PF-005: NewPlantForm Flow

The complete user flow:

1. User fills in: Etiqueta, Genética (cepa), Fecha
2. User selects Sala → ZoneGrid loads
3. User clicks a cell in ZoneGrid → cell highlights, `ubicacion` auto-computed
4. User fills optional fields: Etapa inicial, Producción, IsPublic
5. User submits → plant is created with grid position

### R-PF-006: abreviatura Field in FormularioCepa

The `FormularioCepa.tsx` MUST be updated to include an `abreviatura` field:

```tsx
const cepaFormSchema = z.object({
  // ... existing fields
  abreviatura: z.string().min(1, "La abreviatura es requerida").max(10),
});
```

- The field MUST appear as a text input with label "Abreviatura" and placeholder "Ej: OGK, AK47, WW".
- The field MUST be required.
- The mutation payload MUST include `abreviatura`.

#### Scenario: Create cepa with abreviatura

- GIVEN the user fills FormularioCepa with abreviatura "OGK"
- WHEN they submit
- THEN the payload includes `abreviatura: "OGK"`
- AND the cepa is created successfully

#### Scenario: Submit without abreviatura shows validation

- GIVEN the user leaves abreviatura empty
- WHEN they try to submit
- THEN the form shows validation error: "La abreviatura es requerida"
- AND the mutation is NOT called

### R-PF-007: Cepa List Displays Abreviatura

The cepa selector in `NewPlantForm` currently shows:

```tsx
{gen.geneticaParental} ({gen.dominancia})
```

This SHOULD be updated to also show the abreviatura:

```tsx
{gen.geneticaParental} ({gen.dominancia}) [{gen.abreviatura}]
```

Or as a tooltip/subtitle.
