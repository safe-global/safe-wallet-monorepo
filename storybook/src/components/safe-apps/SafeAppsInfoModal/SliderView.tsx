import type { ReactElement } from 'react'
import { Button } from '@/components/ui/button'
import css from './styles.module.css'

export type SliderViewProps = {
  slides: ReactElement[]
  activeStep: number
  onPrev: () => void
  onNext: () => void
}

export function SliderView({ slides, activeStep, onPrev, onNext }: SliderViewProps): ReactElement {
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
          {slides.map((slide, index) => (
            <div className={css.sliderItem} key={index}>
              {slide}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex w-full shrink-0 gap-2 border-border pt-4">
        <Button variant="outline" size="sm" className="min-w-0 flex-1" onClick={onPrev}>
          {isFirstStep ? 'Cancel' : 'Back'}
        </Button>

        <Button variant="default" size="sm" className="min-w-0 flex-1" onClick={onNext}>
          Continue
        </Button>
      </div>
    </>
  )
}
