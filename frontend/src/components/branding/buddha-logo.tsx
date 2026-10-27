import { useId } from "react";
import { cn } from "@/lib/utils/cn";

/*
 * Original seated-Buddha mark: meditation posture (dhyana mudra) on a lotus throne,
 * crowned by the flame-shaped rasmi typical of Khmer Buddha images, with a halo.
 * Drawn on a 64×64 grid so the silhouette stays legible down to 14px.
 */
const PATHS = {
  rasmi: "M32 6.5C33.6 8.6 34.2 10.6 33.4 12.6H30.6C29.8 10.6 30.4 8.6 32 6.5Z",
  body:
    "M32 26.8C36.5 26.8 40.2 28.4 41.6 31.6C43 34.8 42.4 38.2 43.4 40.6C47.6 41.6 51 43.6 51 46.6C51 49.2 47.4 50.4 42 50.4H22C16.6 50.4 13 49.2 13 46.6C13 43.6 16.4 41.6 20.6 40.6C21.6 38.2 21 34.8 22.4 31.6C23.8 28.4 27.5 26.8 32 26.8Z",
  lotus:
    "M13 52Q17.5 49.8 20 52Q23.5 49.4 26 52Q29 49 32 52Q35 49 38 52Q40.5 49.4 44 52Q46.5 49.8 51 52C49.5 55.6 44.5 57.8 38 57.8H26C19.5 57.8 14.5 55.6 13 52Z",
  arms: "M24.6 33C25 37.6 27.4 40.6 30.2 41.7M39.4 33C39 37.6 36.6 40.6 33.8 41.7",
  legs: "M19.5 45.8C25 44.2 39 44.2 44.5 45.8",
  robe: "M27.4 28.4C29.6 31 31.4 33.6 32.6 36.6",
} as const;

export interface BuddhaLogoProps {
  className?: string;
  /** Accessible name. Omit when adjacent text already names the brand (the logo is then decorative). */
  title?: string;
  /** Thin circular frame, used for the primary brand placements. */
  framed?: boolean;
  /**
   * "full" uses the brand colours with fine line detail;
   * "mark" is a single-colour (currentColor) glyph for small indicators.
   */
  variant?: "full" | "mark";
}

export function BuddhaLogo({ className, title, framed = false, variant = "full" }: BuddhaLogoProps) {
  const titleId = useId();
  const mark = variant === "mark";
  const figure = mark ? "currentColor" : "var(--logo-figure)";
  const halo = mark ? "currentColor" : "var(--logo-halo)";

  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-labelledby={title ? titleId : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title && <title id={titleId}>{title}</title>}
      {framed && <circle cx="32" cy="32" r="30.6" fill="none" stroke={halo} strokeWidth="1.3" />}
      <g transform={framed ? "translate(32 33) scale(0.84) translate(-32 -32)" : undefined}>
        <circle cx="32" cy="21" r="12.6" fill={halo} opacity={mark ? 0.22 : 0.18} />
        <circle cx="32" cy="21" r="12.6" fill="none" stroke={halo} strokeWidth="1.2" />
        <path d={PATHS.rasmi} fill={halo} />
        <ellipse cx="32" cy="13.7" rx="3" ry="2.2" fill={figure} />
        <ellipse cx="32" cy="19.6" rx="5.4" ry="6" fill={figure} />
        <ellipse cx="26.7" cy="20.6" rx="1.2" ry="3.3" fill={figure} />
        <ellipse cx="37.3" cy="20.6" rx="1.2" ry="3.3" fill={figure} />
        <rect x="29.8" y="24.4" width="4.4" height="3.6" rx="1" fill={figure} />
        <path d={PATHS.body} fill={figure} />
        {!mark && (
          <g fill="none" stroke="var(--logo-detail)" strokeWidth="1.1" strokeLinecap="round" opacity="0.9">
            <path d={PATHS.arms} />
            <path d={PATHS.legs} />
            <path d={PATHS.robe} />
            <ellipse cx="32" cy="42.4" rx="3" ry="1.2" />
          </g>
        )}
        <path d={PATHS.lotus} fill={halo} />
        <path d="M19 60.2H45" stroke={halo} strokeWidth="1.4" strokeLinecap="round" />
      </g>
    </svg>
  );
}
