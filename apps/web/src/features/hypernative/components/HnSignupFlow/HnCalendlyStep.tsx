import { useRef } from 'react'
import HnSignupLayout from './HnSignupLayout'
import { useCalendlyEventScheduled } from '../../hooks/useCalendlyEventScheduled'
import { useCalendlyScript } from '../../hooks/useCalendlyScript'
import css from './styles.module.css'

export type HnCalendlyStepProps = {
  calendlyUrl: string
  onBookingScheduled?: () => void
}

const HnCalendlyStep = ({ calendlyUrl, onBookingScheduled }: HnCalendlyStepProps) => {
  const widgetRef = useRef<HTMLDivElement>(null)

  useCalendlyEventScheduled(onBookingScheduled)
  useCalendlyScript(widgetRef, calendlyUrl)

  return (
    <HnSignupLayout contentClassName={css.calendlyColumn}>
      <div className={css.calendlyWrapper}>
        <div ref={widgetRef} id="calendly-widget" style={{ minWidth: '320px', height: '700px' }} />
      </div>
    </HnSignupLayout>
  )
}

export default HnCalendlyStep
