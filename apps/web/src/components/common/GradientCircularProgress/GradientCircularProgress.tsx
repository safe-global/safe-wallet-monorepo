import { useMemo, useRef, type CSSProperties } from 'react'

export interface GradientCircularProgressProps {
  /** Diameter of the spinner in pixels */
  size?: number
  /** Stroke width of the progress circle in pixels */
  thickness?: number
  /** Start color of the gradient (at 0%) */
  startColor?: string
  /** End color of the gradient (at 100%) */
  endColor?: string
  /** Gradient direction - 'vertical' (top to bottom) or 'horizontal' (left to right) */
  direction?: 'vertical' | 'horizontal'
  /** Unique ID for the gradient definition (auto-generated if not provided) */
  gradientId?: string
  className?: string
  style?: CSSProperties
}

/**
 * Indeterminate circular progress spinner with gradient color support.
 * Replaces the previous MUI CircularProgress wrapper, applying a linear
 * gradient to the rotating progress arc.
 */
export const GradientCircularProgress = ({
  size = 40,
  thickness = 3.6,
  startColor = 'var(--color-info-main)',
  endColor = 'var(--color-static-text-brand)',
  direction = 'vertical',
  gradientId,
  className,
  style,
}: GradientCircularProgressProps) => {
  // Generate unique gradient ID if not provided (stable across renders)
  const generatedIdRef = useRef<string | null>(null)
  const uniqueGradientId = useMemo(() => {
    if (gradientId) {
      return gradientId
    }
    if (!generatedIdRef.current) {
      generatedIdRef.current = `gradient-${Math.random().toString(36).substring(2, 9)}`
    }
    return generatedIdRef.current
  }, [gradientId])

  const gradientCoords = useMemo(() => {
    if (direction === 'horizontal') {
      return { x1: '0%', y1: '0%', x2: '100%', y2: '0%' }
    }
    return { x1: '0%', y1: '100%', x2: '0%', y2: '0%' }
  }, [direction])

  const VIEWBOX = 44
  const radius = (VIEWBOX - thickness) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <span
      role="progressbar"
      aria-label="Loading"
      className={`inline-block animate-spin ${className ?? ''}`}
      style={{ width: size, height: size, ...style }}
    >
      <svg viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} width={size} height={size}>
        <defs>
          <linearGradient id={uniqueGradientId} {...gradientCoords}>
            <stop offset="0%" stopColor={startColor} />
            <stop offset="100%" stopColor={endColor} />
          </linearGradient>
        </defs>
        <circle
          cx={VIEWBOX / 2}
          cy={VIEWBOX / 2}
          r={radius}
          fill="none"
          stroke={`url(#${uniqueGradientId})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
        />
      </svg>
    </span>
  )
}
