/**
 * Single source of truth for plant stage colors and labels.
 *
 * Consumers: PlantListView (colors), PlantProfile (labels), WeeklyStageRail
 * and the grouped timeline list (both). Keeping one palette here avoids the
 * stage/color divergence that existed when each component owned a local copy.
 */

export const ETAPA_COLORS = {
  GERMINACION: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  PLANTIN: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  VEGETACION: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  FLORACION: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  COSECHADA: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
} as const;

export type Etapa = keyof typeof ETAPA_COLORS;

export const ETAPA_LABELS: Record<Etapa, string> = {
  GERMINACION: "Germinación",
  PLANTIN: "Plantín",
  VEGETACION: "Vegetación",
  FLORACION: "Floración",
  COSECHADA: "Cosechada",
};

/**
 * Week 0 uses germination/plantin specific wording: at sow time the plant is a
 * seed or a cutting, not yet a "Germinación"/"Plantín" stage in the timeline.
 */
export const WEEK_ZERO_LABELS: Partial<Record<Etapa, string>> = {
  GERMINACION: "Semilla",
  PLANTIN: "Esqueje",
};

function isKnownEtapa(etapa: string): etapa is Etapa {
  return Object.prototype.hasOwnProperty.call(ETAPA_COLORS, etapa);
}

/**
 * Returns the Tailwind classes for a stage. Unknown/malformed values fall back
 * to an empty string so the caller can still render the stage text safely.
 */
export function getEtapaColor(etapa: string): string {
  if (!etapa || !isKnownEtapa(etapa)) return "";
  return ETAPA_COLORS[etapa];
}

/**
 * Returns the display label for a stage. Unknown/malformed values fall back to
 * the raw string so the UI never renders `undefined`.
 */
export function getEtapaLabel(etapa: string): string {
  if (!etapa || !isKnownEtapa(etapa)) return etapa || "";
  return ETAPA_LABELS[etapa];
}
