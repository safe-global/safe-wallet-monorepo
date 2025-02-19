import { MODALS_CATEGORY, trackEvent } from '@/services/analytics'
import type { Dispatch, ReactElement, SetStateAction } from 'react'
import { useState } from 'react'

export type StepRenderProps<TData> = {
  data: TData
  onSubmit: (data: Partial<TData>) => void
  onBack: (data?: Partial<TData>) => void
  setStep: (step: number) => void
  setProgressColor?: Dispatch<SetStateAction<string>>
  setStepData?: Dispatch<SetStateAction<TData>>
}

type Step<TData> = {
  title: string
  subtitle: string
  render: ({
    data,
    onSubmit,
    onBack,
    setStep,
    setProgressColor,
    setStepData,
  }: {
    data: StepRenderProps<TData>['data']
    onSubmit: StepRenderProps<TData>['onSubmit']
    onBack: StepRenderProps<TData>['onBack']
    setStep: StepRenderProps<TData>['setStep']
    setProgressColor: StepRenderProps<TData>['setProgressColor']
    setStepData: StepRenderProps<TData>['setStepData']
  }) => ReactElement
}

export type TxStepperProps<TData> = {
  steps: Array<Step<TData>>
  initialData: TData
  initialStep?: number
  eventCategory?: string
  customProgressBar?: ReactElement
  setWidgetStep?: (step: number | SetStateAction<number>) => void
  onClose: () => void
}

export const useCardStepper = <TData>({
  steps,
  initialData,
  initialStep,
  eventCategory = MODALS_CATEGORY,
  onClose,
  setWidgetStep,
}: TxStepperProps<TData>) => {
  const [activeStep, setActiveStep] = useState<number>(initialStep || 0)
  const [stepData, setStepData] = useState(initialData)

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1)
    setWidgetStep && setWidgetStep((prevActiveStep) => prevActiveStep + 1)
    trackEvent({ category: eventCategory, action: lastStep ? 'Submit' : 'Next', label: activeStep })
  }

  const handleBack = (data?: Partial<TData>) => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
    setWidgetStep && setWidgetStep((prevActiveStep) => prevActiveStep - 1)
    trackEvent({ category: eventCategory, action: firstStep ? 'Cancel' : 'Back', label: activeStep })

    if (data) {
      setStepData((previous) => ({ ...previous, ...data }))
    }
  }

  const setStep = (step: number) => {
    setActiveStep(step)
    setWidgetStep && setWidgetStep(step)
  }

  const firstStep = activeStep === 0
  const lastStep = activeStep === steps.length - 1

  const onBack = firstStep ? onClose : handleBack

  const onSubmit = (data: Partial<TData>) => {
    if (lastStep) {
      onClose()
      return
    }
    setStepData((previous) => ({ ...previous, ...data }))
    handleNext()
  }

  return {
    onBack,
    onSubmit,
    setStep,
    activeStep,
    stepData,
    firstStep,
    setStepData,
  }
}
