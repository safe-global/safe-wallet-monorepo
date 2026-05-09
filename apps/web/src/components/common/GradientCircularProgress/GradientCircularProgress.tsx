import type { CircularProgressProps } from '@mui/material'
import { CircularProgress } from '@mui/material'
import { useMemo, useRef } from 'react'

export interface GradientCircularProgressProps extends Omit<CircularProgressProps, 'color'> {
  /** Start color of the gradient (at 0%) */
  startColor?: string
  /** End color of the gradient (at 100%) */
  endColor?: string
  /** Gradient direction - 'vertical' (top to bottom) or 'horizontal' (left to right) */
  direction?: 'vertical' | 'horizontal'
  /** Unique ID for the gradient definition (auto-generated if not provided) */
  gradientId?: string
}

/**
 * CircularProgress component with gradient color support
 * Wraps MUI CircularProgress and applies a linear gradient to the progress circle
 */
export const GradientCircularProgress = ({
  startColor = 'var(--color-info-main)',
  endColor = 'var(--color-static-text-brand)',
  direction = 'vertical',
  gradientId,
  sx,
  ...circularProgressProps
}: GradientCircularProgressProps) => {
  // Generate unique gradient ID if not provided (stable across renders)
  const generatedIdRef = useRef<string | null>(null)
  const uniqueGradientId = useMemo(() => {
    if (gradientId) {
      return gradientId
    }
    // Generate ID once and reuse it
    if (!generatedIdRef.current) {
      generatedIdRef.current = `gradient-${Math.random().toString(36).substring(2, 9)}`
    }
    return generatedIdRef.current
  }, [gradientId])

  // Determine gradient coordinates based on direction
  const gradientCoords = useMemo(() => {
    if (direction === 'horizontal') {
      return { x1: '0%', y1: '0%', x2: '100%', y2: '0%' }
    }
    // vertical (default)
    return { x1: '0%', y1: '100%', x2: '0%', y2: '0%' }
  }, [direction])

  return (
    <>
      {/* Gradient definition */}
      <svg width={0} height={0} style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id={uniqueGradientId} {...gradientCoords}>
            <stop offset="0%" stopColor={startColor} />
            <stop offset="100%" stopColor={endColor} />
          </linearGradient>
        </defs>
      </svg>

      <CircularProgress
        {...circularProgressProps}
        sx={{
          color: 'transparent', // Disable default color
          '& .MuiCircularProgress-circle': {
            stroke: `url(#${uniqueGradientId})`,
          },
          ...sx,
        }}
      />
    </>
  )
}
