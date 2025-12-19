import { useRef } from 'react'
import HnSignupLayout from './HnSignupLayout'
import { useCalendlyEventScheduled } from '../../hooks/useCalendlyEventScheduled'
import { useCalendlyScript } from '../../hooks/useCalendlyScript'
import { useCalendlyPageChange } from '../../hooks/useCalendlyPageChange'
import css from './styles.module.css'

export type HnCalendlyStepProps = {
  calendlyUrl: string
  onBookingScheduled?: () => void
}

const HnCalendlyStep = ({ calendlyUrl, onBookingScheduled }: HnCalendlyStepProps) => {
  const widgetRef = useRef<HTMLDivElement>(null)
  const isSecondStep = useCalendlyPageChange()

  useCalendlyEventScheduled(onBookingScheduled)
  useCalendlyScript(widgetRef, calendlyUrl)

  return (
    <HnSignupLayout contentClassName={css.calendlyColumn}>
      <div className={css.calendlyWrapper}>
        {!isSecondStep && (
          <div className={css.calendlyHeader}>
            <h2 className={css.calendlyTitle}>Get connected to the right expert</h2>
          </div>
        )}
        <div
          ref={widgetRef}
          id="calendly-widget"
          className={css.calendlyWidget}
          style={{
            minWidth: '310px',
            height: '700px',
            ...(!isSecondStep && { marginTop: '18px' }),
          }}
        />
      </div>
    </HnSignupLayout>
  )
}

export default HnCalendlyStep
