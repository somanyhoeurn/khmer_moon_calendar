import { cn } from "@/lib/utils/cn";
import type { LunarDate } from "@/types/api";

type PhaseInput = Pick<LunarDate, "phase" | "lunar_day" | "days_in_month">;

/** Share of the disc that is lit, derived from the API's lunar day (no calendar maths). */
export function illumination({ phase, lunar_day, days_in_month }: PhaseInput): number {
  const fraction = phase === "waxing" ? lunar_day / 15 : 1 - lunar_day / Math.max(1, days_in_month - 15);
  return Math.min(1, Math.max(0, fraction));
}

/** Visual waxing/waning indicator. Decorative: the lunar date is always also given as text. */
export function MoonPhaseIcon({ lunar, className }: { lunar: PhaseInput; className?: string }) {
  const f = illumination(lunar);
  const r = 6.5;
  const rx = (r * Math.abs(1 - 2 * f)).toFixed(2);
  const waxing = lunar.phase === "waxing";
  const lit = waxing
    ? `M8 1.5A${r} ${r} 0 0 1 8 14.5A${rx} ${r} 0 0 ${f < 0.5 ? 0 : 1} 8 1.5Z`
    : `M8 1.5A${r} ${r} 0 0 0 8 14.5A${rx} ${r} 0 0 ${f < 0.5 ? 1 : 0} 8 1.5Z`;

  return (
    <svg viewBox="0 0 16 16" className={cn("shrink-0", className)} aria-hidden focusable="false">
      <circle cx="8" cy="8" r={r} className="fill-surface-muted stroke-border-strong" strokeWidth="0.8" />
      {f >= 0.98 ? <circle cx="8" cy="8" r={r} className="fill-gold" /> : f > 0.02 && <path d={lit} className="fill-gold" />}
    </svg>
  );
}
