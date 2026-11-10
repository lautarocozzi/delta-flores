import type { BackendEvent } from "@/interfaces/Eventos";
import type { PlantaDto } from "@/interfaces/Planta";
import { WEEK_ZERO_LABELS, getEtapaLabel, type Etapa } from "@/lib/etapas";

/**
 * The rail renders at most this many chips. The calculation never truncates:
 * weeks past week 51 must remain visible in the grouped list.
 */
export const TIMELINE_MAX_RAIL_WEEKS = 52;

export interface TimelineWeek {
  weekNumber: number; // 0-indexed
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd, inclusive
  startLabel: string; // e.g. "12 mar"
  endLabel: string;
  etapa: Etapa; // drives the color
  label: string; // drives the text (Semilla/Esqueje in week 0)
  events: BackendEvent[];
  hasEvents: boolean;
  hasPreSowingEvents: boolean;
}

const DAY_MS = 86_400_000;
const MONTHS_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

/**
 * Normalizes an ISO date to a UTC day number by slicing the string first.
 * Using `new Date(isoString)` here would drift across timezones.
 */
function toUtcDay(iso: string): number {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function localTodayToUtcDay(today: Date): number {
  return Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
}

function diffDays(iso: string, anchorUtcDay: number): number {
  return (toUtcDay(iso) - anchorUtcDay) / DAY_MS;
}

function weekOf(iso: string, anchorUtcDay: number): number {
  return Math.floor(diffDays(iso, anchorUtcDay) / 7);
}

function clampWeek(week: number, maxWeek: number): number {
  return Math.min(Math.max(week, 0), maxWeek);
}

function toIsoDate(utcDayMs: number): string {
  const date = new Date(utcDayMs);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDayLabel(utcDayMs: number): string {
  const date = new Date(utcDayMs);
  return `${date.getUTCDate()} ${MONTHS_ES[date.getUTCMonth()]}`;
}

/**
 * 0-indexed current week for a plant, clamped to >= 0.
 */
export function calculateCurrentWeek(fechaSiembra: string, today: Date = new Date()): number {
  const anchorUtcDay = toUtcDay(fechaSiembra);
  const current = Math.floor((localTodayToUtcDay(today) - anchorUtcDay) / DAY_MS / 7);
  return Math.max(0, current);
}

interface StageChangeInfo {
  fecha: string;
  id: number;
  etapaAnterior: string | undefined;
  nuevaEtapa: string;
  week: number;
}

function getEtapaAnterior(event: BackendEvent): string | undefined {
  // The backend serializes `etapaAnterior` for STAGE_CHANGE events, but the
  // shared BackendEvent interface does not declare it yet. Stay local instead
  // of redefining or mutating the shared type.
  return (event as BackendEvent & { etapaAnterior?: string }).etapaAnterior;
}

function isStageChangeWithTarget(event: BackendEvent): boolean {
  return event.eventType === "STAGE_CHANGE" && Boolean(event.nuevaEtapa);
}

/**
 * Builds one entry per week from week 0 through `max(currentWeek, last event week)`.
 * Events before the anchor are clamped to week 0 and flagged via
 * `hasPreSowingEvents`, never dropped.
 */
export function buildWeeklyTimeline(
  planta: Pick<PlantaDto, "fecha_siembra" | "fechaCreacion" | "etapa">,
  events: BackendEvent[],
): TimelineWeek[] {
  const anchorIso = planta.fecha_siembra ?? planta.fechaCreacion;
  const anchorUtcDay = toUtcDay(anchorIso);

  const currentWeek = calculateCurrentWeek(anchorIso);
  const eventWeeks = events.map((event) => weekOf(event.fecha, anchorUtcDay));
  const maxEventWeek = eventWeeks.length > 0 ? Math.max(...eventWeeks) : 0;
  const maxWeek = Math.max(currentWeek, maxEventWeek);

  const changes: StageChangeInfo[] = events
    .filter(isStageChangeWithTarget)
    .map((event) => ({
      fecha: event.fecha,
      id: event.id,
      etapaAnterior: getEtapaAnterior(event),
      nuevaEtapa: event.nuevaEtapa as string,
      week: weekOf(event.fecha, anchorUtcDay),
    }))
    .sort((a, b) => {
      const aDate = a.fecha.slice(0, 10);
      const bDate = b.fecha.slice(0, 10);
      if (aDate !== bDate) return aDate < bDate ? -1 : 1;
      return a.id - b.id;
    });

  const baseEtapa = (changes[0]?.etapaAnterior ?? planta.etapa) as Etapa;
  const weekZeroLabel = WEEK_ZERO_LABELS[baseEtapa] ?? getEtapaLabel(baseEtapa);

  const buckets: BackendEvent[][] = Array.from({ length: maxWeek + 1 }, () => []);
  events.forEach((event, index) => {
    buckets[clampWeek(eventWeeks[index], maxWeek)].push(event);
  });

  const weeks: TimelineWeek[] = [];
  for (let weekNumber = 0; weekNumber <= maxWeek; weekNumber += 1) {
    const etapa = resolveEtapaForWeek(weekNumber, baseEtapa, changes);
    const weekEvents = buckets[weekNumber];
    const startMs = anchorUtcDay + weekNumber * 7 * DAY_MS;
    const endMs = startMs + 6 * DAY_MS;

    weeks.push({
      weekNumber,
      startDate: toIsoDate(startMs),
      endDate: toIsoDate(endMs),
      startLabel: formatDayLabel(startMs),
      endLabel: formatDayLabel(endMs),
      etapa,
      label: weekNumber === 0 ? weekZeroLabel : getEtapaLabel(etapa),
      events: weekEvents,
      hasEvents: weekEvents.length > 0,
      hasPreSowingEvents: weekEvents.some(
        (event) => weekOf(event.fecha, anchorUtcDay) < 0,
      ),
    });
  }

  return weeks;
}

function resolveEtapaForWeek(
  weekNumber: number,
  baseEtapa: Etapa,
  changes: StageChangeInfo[],
): Etapa {
  // Week 0 always reflects the stage the plant came from, even if a stage
  // change happened during week 0 (spec: "Etapa de la semana 0").
  if (weekNumber === 0) return baseEtapa;

  let applicable: StageChangeInfo | undefined;
  for (const change of changes) {
    const clampedChangeWeek = Math.max(change.week, 0);
    if (clampedChangeWeek <= weekNumber) applicable = change;
  }

  return (applicable?.nuevaEtapa as Etapa | undefined) ?? baseEtapa;
}
