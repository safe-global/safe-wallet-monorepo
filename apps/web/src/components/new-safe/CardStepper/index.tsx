import { useState } from 'react'
import { lightPalette } from '@safe-global/theme/palettes'
import type { TxStepperProps } from './useCardStepper'
import { useCardStepper } from './useCardStepper'
import { CardStepperView } from '@views/components/new-safe/CardStepper/CardStepperView'

export function CardStepper<StepperData>(props: TxStepperProps<StepperData>) {
  const [progressColor, setProgressColor] = useState(lightPalette.secondary.main)
  const { activeStep, onSubmit, onBack, stepData, setStep, setStepData } = useCardStepper<StepperData>(props)
  const { steps } = props
  const currentStep = steps[activeStep]
  const progress = ((activeStep + 1) / steps.length) * 100

  return (
    <CardStepperView
      progress={progress}
      progressColor={progressColor}
      activeStep={activeStep}
      title={currentStep.title}
      subtitle={currentStep.subtitle}
    >
      {currentStep.render(stepData, onSubmit, onBack, setStep, setProgressColor, setStepData)}
    </CardStepperView>
  )
}
