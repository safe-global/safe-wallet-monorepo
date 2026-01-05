import { useRef } from 'react'
import HnSignupLayout from './HnSignupLayout'
import { useCalendly } from '../../hooks/useCalendly'
import css from './styles.module.css'
import { Typography } from '@mui/material'

export type HnCalendlyStepProps = {
  calendlyUrl: string
  onBookingScheduled?: () => void
}

const HnCalendlyStep = ({ calendlyUrl, onBookingScheduled }: HnCalendlyStepProps) => {
  const widgetRef = useRef<HTMLDivElement>(null)
  const { isSecondStep } = useCalendly(widgetRef, calendlyUrl, onBookingScheduled)

  return (
    <HnSignupLayout contentClassName={css.calendlyColumn}>
      <div className={css.calendlyWrapper}>
        {!isSecondStep && (
          <div className={css.calendlyHeader}>
            <Typography variant="h2" className={css.calendlyTitle}>
              Get connected to the right expert
            </Typography>
          </div>
        )}
        <div
          ref={widgetRef}
          id="calendly-widget"
          className={`${css.calendlyWidget} ${!isSecondStep ? css.calendlyWidgetWithHeader : ''}`}
        />
      </div>
    </HnSignupLayout>
  )
}

export default HnCalendlyStep
