import React, { useState, useEffect, useMemo } from 'react'
import { SliderView } from '@views/components/safe-apps/SafeAppsInfoModal/SliderView'

type SliderProps = {
  onSlideChange: (slideIndex: number) => void
  initialStep?: number
  children: React.ReactNode
}

const SLIDER_TIMEOUT = 500

const Slider: React.FC<SliderProps> = ({ onSlideChange, children, initialStep }) => {
  const allSlides = useMemo(() => React.Children.toArray(children).filter(Boolean) as React.ReactElement[], [children])

  const [activeStep, setActiveStep] = useState(initialStep || 0)
  const [disabledBtn, setDisabledBtn] = useState(false)

  useEffect(() => {
    let id: ReturnType<typeof setTimeout> | undefined

    if (disabledBtn) {
      id = setTimeout(() => {
        setDisabledBtn(false)
      }, SLIDER_TIMEOUT)
    }

    return () => {
      if (id) clearTimeout(id)
    }
  }, [disabledBtn])

  const nextSlide = () => {
    if (disabledBtn) return

    const nextStep = activeStep + 1

    onSlideChange(nextStep)
    setActiveStep(nextStep)
    setDisabledBtn(true)
  }

  const prevSlide = () => {
    if (disabledBtn) return

    const prevStep = activeStep - 1

    onSlideChange(prevStep)
    setActiveStep(prevStep)
    setDisabledBtn(true)
  }

  return <SliderView slides={allSlides} activeStep={activeStep} onPrev={prevSlide} onNext={nextSlide} />
}

export default Slider
