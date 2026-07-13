import { useState } from 'react'
import { lightPalette } from '@safe-global/theme/palettes'
import css from './styles.module.css'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import type { TxStepperProps } from './useCardStepper'
import { useCardStepper } from './useCardStepper'

export function CardStepper<StepperData>(props: TxStepperProps<StepperData>) {
  const [progressColor, setProgressColor] = useState(lightPalette.secondary.main)
  const { activeStep, onSubmit, onBack, stepData, setStep, setStepData } = useCardStepper<StepperData>(props)
  const { steps } = props
  const currentStep = steps[activeStep]
  const progress = ((activeStep + 1) / steps.length) * 100

  return (
    <Card>
      <div className="h-1 w-full overflow-hidden bg-[var(--color-background-main)]">
        <div
          className="h-full transition-all"
          style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: progressColor }}
        />
      </div>
      {currentStep.title && (
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
            <Typography variant="h4">{currentStep.title}</Typography>
            {currentStep.subtitle && (
              <Typography variant="paragraph-small" className="text-[var(--color-text-primary)]">
                {currentStep.subtitle}
              </Typography>
            )}
          </div>
        </div>
      )}
      <div className={css.content}>
        {currentStep.render(stepData, onSubmit, onBack, setStep, setProgressColor, setStepData)}
      </div>
    </Card>
  )
}
