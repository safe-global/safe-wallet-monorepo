import type { ReactElement, ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import css from './styles.module.css'

export type CardStepperViewProps = {
  progress: number
  progressColor: string
  activeStep: number
  title?: string
  subtitle?: string
  children: ReactNode
}

export function CardStepperView({
  progress,
  progressColor,
  activeStep,
  title,
  subtitle,
  children,
}: CardStepperViewProps): ReactElement {
  return (
    // `size="none"`: the progress bar sits on the top edge, clipped by the card's overflow + radius
    <Card size="none">
      <div className="h-1 w-full overflow-hidden bg-[var(--color-background-main)]">
        <div
          className="h-full transition-all"
          style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: progressColor }}
        />
      </div>
      {title && (
        <div className={`${css.header} flex items-center gap-4`}>
          <div
            className={css.step}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
          >
            <Typography variant="paragraph-small" className="text-primary-foreground">
              {activeStep + 1}
            </Typography>
          </div>
          <div className="flex flex-col gap-1">
            <Typography variant="h4">{title}</Typography>
            {subtitle && (
              <Typography variant="paragraph-small" className="text-[var(--color-text-primary)]">
                {subtitle}
              </Typography>
            )}
          </div>
        </div>
      )}
      <div className={css.content}>{children}</div>
    </Card>
  )
}
