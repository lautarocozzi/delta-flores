# Frontend: Location Editor — Visual Grid Rotation and Select-Based Modes

## Purpose

Provide two complementary modes for editing a plant's location after creation:

1. **Visual grid mode** — click cells in the ZoneGrid to move the plant.
2. **Select-based mode** — dropdown selects for Zona, Columna, Fila for quick keyboard-based editing.

Accessible from the plant detail page or edit dialog.

## Requirements

### R-LE-001: Location Editor Component

```typescript
interface LocationEditorProps {
  planta: PlantaDto;
  onLocationUpdate: (updatedPlanta: PlantaDto) => void;
  onCancel: () => void;
}
```

- MUST be a dialog, drawer, or expandable section on the plant detail page.
- MUST show the current location (if any) when opened.
- MUST offer a toggle between "Visual" and "Select" modes.

### R-LE-002: Visual Grid Mode

- Renders a `ZoneGrid` component in `select` mode.
- The current plant's cell MUST be pre-highlighted as "current position".
- Occupied cells (other plants) MUST be shown as occupied.
- The user clicks a free cell to move the plant there.
- On confirm/cell click, calls `apiService.updateUbicacion(plantaId, { zonaId, columnaEnZona, filaEnZona })`.

#### Scenario: Visual grid shows current position

- GIVEN a plant at Zona #1, col 2, fila 3
- WHEN the LocationEditor opens in visual mode
- THEN cell (Z1, C2, F3) is highlighted as "current position"
- AND the user can click another cell to move

#### Scenario: Move plant to free cell via visual grid

- GIVEN LocationEditor in visual mode
- WHEN the user clicks a free cell (Z1, C3, F1)
- THEN `updateUbicacion` is called with `{ zonaId: 1, columnaEnZona: 3, filaEnZona: 1 }`
- AND the component shows a success toast
- AND `onLocationUpdate` is called with the updated plant
- AND the dialog closes

#### Scenario: Move fails due to occupied cell

- GIVEN the target cell was occupied (another plant moved there between render and click)
- WHEN `updateUbicacion` returns 409
- THEN the component shows an error toast: "Esa posición ya está ocupada. Selecciona otra."
- AND the ZoneGrid re-fetches to show the updated occupancy

### R-LE-003: Select-Based Mode

Provides three cascading dropdowns:

1. **Zona**: Populated from `apiService.getZonasBySala(planta.salaId)`. Pre-selects the plant's current zone.
2. **Columna**: Numbers 1 to `zona.columnas`. Pre-selects current column.
3. **Fila**: Numbers 1 to `zona.filas`. Pre-selects current row.

- The Columna and Fila dropdowns MUST update when Zona changes.
- The Fila dropdown MUST update when Columna changes (maximum is zone.filas regardless).

#### Scenario: Select mode cascading dropdowns

- GIVEN a plant in Zona #1 (which has 3 columns × 2 rows)
- WHEN LocationEditor opens in select mode
- THEN Zona dropdown shows: `[Zona #1 selected]`
- AND Columna dropdown shows: `1, 2, 3` with `[2 selected]`
- AND Fila dropdown shows: `1, 2` with `[3 selected]`
- AND the auto-generated ubicacion preview is shown: `OGK-Z1-C2-F3`

#### Scenario: Change zona in select mode

- GIVEN the user changes Zona from #1 to #2 (which has 5 columns × 4 rows)
- WHEN the zona dropdown changes
- THEN Columna resets to 1 and shows 1-5
- AND Fila resets to 1 and shows 1-4
- AND the preview updates

### R-LE-004: Ubicacion Preview

Both modes MUST display a live preview of the ubicacion string:

```
Ubicación: OGK-Z1-C2-F3
```

This updates in real-time as the user interacts with the grid or dropdowns.

### R-LE-005: Confirm/Cancel Actions

- **Confirm button**: calls `updateUbicacion`. Disabled if no change from current position.
- **Cancel button**: closes without saving.

#### Scenario: Confirm with no change

- GIVEN the user opens LocationEditor
- WHEN they do not change the position
- THEN the Confirm button is disabled
- AND clicking Cancel closes without any API call

### R-LE-006: Edge Case — Plant Without Zone

If the plant has no zone assigned (`zonaId = null`):

- Visual mode: Shows ZoneGrid with no cell pre-selected. Message: "Esta planta no tiene una ubicación asignada. Selecciona una celda para asignarla."
- Select mode: All dropdowns start empty with "Seleccionar..." placeholder.
- When the user selects a cell/dropdown values and confirms, the plant is assigned to that position.

#### Scenario: Assign unlocated plant to grid

- GIVEN a plant with `zonaId = null`
- WHEN the user opens LocationEditor
- THEN both modes start empty
- WHEN the user selects a cell and confirms
- THEN `updateUbicacion` is called with valid zonaId/col/fila
- AND the plant's ubicacion is now set

### R-LE-007: Occupied Cell Validation on Confirm

Before calling the API, the component SHOULD optimistically check if the target cell is occupied (based on the occupiedCells data it already has). If the locally-known data says occupied, the confirm button is disabled with a tooltip: "Celda ocupada".

- This is an optimistic check only; the backend is the source of truth.
- If the backend returns 409, the optimistic check was wrong and the error path in R-LE-002 scenario 3 handles it.
