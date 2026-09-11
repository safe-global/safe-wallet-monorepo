import { type ReactElement } from 'react'
import classnames from 'classnames'
import css from './styles.module.css'

const SIZE = 60
const THICKNESS = 5
const RADIUS = (SIZE - THICKNESS) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/**
 * Determinate/indeterminate circular progress ring with a gradient stroke.
 * Replaces the previous MUI `CircularProgress` pair.
 */
export const ProgressRing = ({
  value,
  indeterminate = false,
}: {
  value: number
  indeterminate?: boolean
}): ReactElement => {
  const offset = indeterminate ? CIRCUMFERENCE * 0.75 : CIRCUMFERENCE * (1 - value / 100)

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <defs>
        <linearGradient
          id="progress_gradient"
          x1="21.1648"
          y1="8.21591"
          x2="-9.95028"
          y2="22.621"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#5FDDFF" />
          <stop offset="1" stopColor="#12FF80" />
        </linearGradient>
      </defs>

      <circle
        className={css.circleBg}
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke="currentColor"
        strokeWidth={THICKNESS}
      />

      <circle
        className={classnames(css.circleProgress, {
          'origin-center [transform-box:fill-box] animate-spin': indeterminate,
        })}
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke="url(#progress_gradient)"
        strokeWidth={THICKNESS}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        transform={indeterminate ? undefined : `rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
      />
    </svg>
  )
}
