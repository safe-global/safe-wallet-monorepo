import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import css from './styles.module.css'

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

  const isFirstStep = activeStep === 0

  return (
    <>
      <div className={css.sliderContainer}>
        <div
          className={css.sliderInner}
          style={{
            transform: `translateX(-${activeStep * 100}%)`,
          }}
        >
          {allSlides.map((slide, index) => (
            <div className={css.sliderItem} key={index}>
              {slide}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex w-full gap-2 border-t border-border pt-4">
        <Button variant="outline" size="sm" className="min-w-0 flex-1" onClick={prevSlide}>
          {isFirstStep ? 'Cancel' : 'Back'}
        </Button>

        <Button variant="default" size="sm" className="min-w-0 flex-1" onClick={nextSlide}>
          Continue
        </Button>
      </div>
    </>
  )
}

export default Slider
