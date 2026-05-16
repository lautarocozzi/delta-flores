# Frontend: ZoneGrid Component — Reusable Clickable Grid

## Purpose

Build a reusable `ZoneGrid` component that renders a visual grid of zones by sala. Each cell shows its position, occupied status, and allows click-to-select. On cell click, the component auto-generates the `ubicacion` string in the format `{abreviatura}-Z{zonaId}-C{col}-F{fila}`.

## Requirements

### R-ZG-001: ZoneGrid Component Props

```typescript
interface ZoneGridProps {
  salaId: number | null;
  cepaAbreviatura?: string;          // used to generate ubicacion format
  onCellSelect?: (cell: ZoneCell) => void;  // callback when user clicks a cell
  occupiedCells?: OccupiedCell[];     // pre-marked occupied cells (from existing plants)
  mode?: 'select' | 'view';          // select = clickable, view = read-only
  selectedCell?: { zonaId: number; col: number; fila: number } | null;
}
```

Where:

```typescript
interface ZoneCell {
  zonaId: number;
  zonaNombre: string;
  columna: number;
  fila: number;
  ubicacion: string;
  isOccupied: boolean;
  plantaId?: number;     // if occupied, which plant
  plantaNombre?: string; // if occupied, display name
}

interface OccupiedCell {
  zonaId: number;
  columna: number;
  fila: number;
  plantaId: number;
  plantaNombre: string;
}
```

### R-ZG-002: Data Fetching

- The component MUST fetch zonas via `apiService.getZonasBySala(salaId)` when `salaId` is provided.
- If no `salaId`, the component renders an empty state: "Selecciona una sala para ver las zonas."
- Loading state MUST show a skeleton or spinner.
- Error state MUST show a retry message.

### R-ZG-003: Visual Layout

- Each Zona is rendered as a card/section with:
  - Zona name as heading
  - A CSS grid of `columnas × filas` cells
  - Each cell shows: `{abreviatura}-Z{id}-C{col}-F{fila}` when empty, or the plant name when occupied
- Layout direction: top-to-bottom, left-to-right, 1-indexed:
  - Cell (col=1, fila=1) is top-left
  - Cell (col=columnas, fila=filas) is bottom-right
- Zones are arranged in the container based on `posicionX` and `posicionY` (absolute positioning or CSS grid placement).

#### Scenario: ZoneGrid renders 3x2 zone correctly

- GIVEN a Zona with `columnas: 3, filas: 2`
- WHEN the ZoneGrid renders
- THEN a 3-column × 2-row grid is displayed
- AND cell (1,1) is top-left, cell (3,2) is bottom-right
- AND each cell is labeled `OGK-Z1-C{col}-F{fila}` if `cepaAbreviatura = "OGK"`

### R-ZG-004: Cell Selection

- In `mode='select'`, each unoccupied cell is clickable.
- Clicking a cell calls `onCellSelect` with the `ZoneCell` data, including the auto-generated `ubicacion` string.
- The selected cell MUST be visually highlighted (e.g., primary color border, checkmark overlay).
- Clicking an already-selected cell deselects it (toggle behavior).

#### Scenario: User selects a free cell

- GIVEN ZoneGrid in select mode with `cepaAbreviatura = "AK"`
- WHEN the user clicks cell (2, 1) in Zona #1
- THEN `onCellSelect` is called with:
  ```json
  {
    "zonaId": 1,
    "zonaNombre": "Zona A",
    "columna": 2,
    "fila": 1,
    "ubicacion": "AK-Z1-C2-F1",
    "isOccupied": false,
    "plantaId": undefined,
    "plantaNombre": undefined
  }
  ```
- AND the cell is visually highlighted

### R-ZG-005: Occupied Cells

- Occupied cells MUST be visually distinct (e.g., grayed out, with a plant icon, tooltip showing plant name).
- Occupied cells MUST NOT be clickable in `mode='select'`.
- Occupied cells MUST display the plant name (or a truncated version) within the cell.

#### Scenario: Occupied cell is not selectable

- GIVEN a cell occupied by plant "GEL-005"
- WHEN rendered in `mode='select'`
- THEN the cell shows "GEL-005" with an occupied visual style
- AND clicking the cell does NOT trigger `onCellSelect`

### R-ZG-006: Empty State

- GIVEN a Sala with no Zonas
- WHEN ZoneGrid renders
- THEN a message is displayed: "No hay zonas definidas para esta sala. Crea una zona desde la configuración de la sala."

### R-ZG-007: Responsive Design

- The component MUST be responsive.
- On small screens, cells should be smaller but still tappable (minimum 44px tap target).
- Zone cards should stack vertically on mobile if needed.
