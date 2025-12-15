import { useEffect } from 'react'
import HnSignupLayout from './HnSignupLayout'
import css from './styles.module.css'

export type HnCalendlyStepProps = {
  calendlyUrl: string
}

const HnCalendlyStep = ({ calendlyUrl }: HnCalendlyStepProps) => {
  useEffect(() => {
    // Load Calendly script if not already loaded
    if (!document.querySelector('script[src*="calendly"]')) {
      const calendlyScript = document.createElement('script')
      calendlyScript.type = 'text/javascript'
      calendlyScript.src = 'https://assets.calendly.com/assets/external/widget.js'
      calendlyScript.async = true
      document.body.appendChild(calendlyScript)
    }
  }, [])

  return (
    <HnSignupLayout contentClassName={css.calendlyColumn}>
      <div className={css.calendlyWrapper}>
        <div className="calendly-inline-widget" data-url={calendlyUrl} style={{ minWidth: '320px', height: '700px' }} />
      </div>
    </HnSignupLayout>
  )
}

export default HnCalendlyStep
