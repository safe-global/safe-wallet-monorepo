import type { CSSProperties } from 'react'
import { Progress } from '@/components/ui/progress'

import css from './styles.module.css'

type ProgressBarProps = {
  value?: number
  className?: string
  style?: CSSProperties
  /** @deprecated retained for backwards compatibility, no longer applied */
  color?: string
  /** @deprecated retained for backwards compatibility, applied as inline style */
  sx?: CSSProperties
}

export const ProgressBar = ({ value, className, style, sx }: ProgressBarProps) => {
  return (
    <Progress
      value={value ?? null}
      className={`${css.progressBar} ${className ?? ''}`}
      style={{ ...sx, ...style }}
      aria-label="Progress"
    />
  )
}
