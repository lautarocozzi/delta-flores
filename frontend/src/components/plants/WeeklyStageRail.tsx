import { getEtapaColor } from "@/lib/etapas";
import { cn } from "@/lib/utils";
import { TIMELINE_MAX_RAIL_WEEKS, type TimelineWeek } from "@/utils/timelineUtils";

interface WeeklyStageRailProps {
  weeks: TimelineWeek[];
  activeWeek: number | null;
  onWeekClick: (weekNumber: number) => void;
}

/**
 * Horizontal index of weeks. Renders at most `TIMELINE_MAX_RAIL_WEEKS` chips:
 * the cap lives here and nowhere else, so weeks past 51 still reach the list.
 * The stage label is always rendered as text — color is never the only signal.
 */
export function WeeklyStageRail({ weeks, activeWeek, onWeekClick }: WeeklyStageRailProps) {
  if (weeks.length === 0) return null;

  const visibleWeeks = weeks.slice(0, TIMELINE_MAX_RAIL_WEEKS);

  return (
    <nav aria-label="Semanas de la planta" className="flex gap-2 overflow-x-auto pb-2 snap-x">
      {visibleWeeks.map((week) => {
        const isActive = activeWeek === week.weekNumber;

        return (
          <button
            key={week.weekNumber}
            type="button"
            onClick={() => onWeekClick(week.weekNumber)}
            aria-label={`Semana ${week.weekNumber}, etapa ${week.label}`}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "shrink-0 snap-start rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              getEtapaColor(week.etapa),
              !week.hasEvents && "opacity-50 border-dashed",
              week.etapa === "COSECHADA" && "ring-1 ring-orange-400",
              isActive && "ring-2 ring-primary",
            )}
          >
            <span>
              S{week.weekNumber} · {week.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
