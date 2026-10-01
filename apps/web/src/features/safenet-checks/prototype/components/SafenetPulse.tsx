import type { ReactElement } from 'react'

const RINGS = [3, 5.5, 8]

/** Pending mark for a running check: rings that breathe outwards. Static under reduced motion. */
export const SafenetPulse = ({ size = 16 }: { size?: number }): ReactElement => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    aria-hidden="true"
    className="shrink-0 text-[var(--color-success-main)]"
  >
    {RINGS.map((r, i) => (
      <circle
        key={r}
        cx="10"
        cy="10"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="motion-safe:animate-pulse"
        style={{ animationDelay: `${i * 0.3}s`, opacity: 1 - i * 0.25 }}
      />
    ))}
    <circle cx="10" cy="10" r="1.4" fill="currentColor" />
  </svg>
)
