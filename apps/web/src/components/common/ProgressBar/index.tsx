import type { CSSProperties } from 'react'
import { Progress } from '@/components/ui/progress'

import css from './styles.module.css'

type ProgressBarProps = {
  value?: number
  className?: string
  style?: CSSProperties
  /** Maps legacy MUI `primary` and `secondary` intents to the shadcn indicator. */
  color?: string
  /** @deprecated retained for backwards compatibility, applied as inline style */
  sx?: CSSProperties
}

export const ProgressBar = ({ value, className, style, sx, color }: ProgressBarProps) => {
  return (
    <Progress
      value={value ?? null}
      className={`${css.progressBar} ${className ?? ''}`}
      indicatorClassName={color === 'secondary' ? 'bg-[var(--color-secondary-main)]' : undefined}
      style={{ ...sx, ...style }}
      aria-label="Progress"
    />
  )
}
