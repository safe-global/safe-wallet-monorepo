import { Grid2, Typography, Button } from '@mui/material'
import { useEffect, useRef } from 'react'
import css from './styles.module.css'

declare global {
  interface Window {
    hbspt?: {
      forms: {
        create: (options: { portalId: string; formId: string; region: string; target?: string }) => void
      }
    }
  }
}

export type HnSignupFormProps = {
  portalId: string
  formId: string
  region?: string
  onCancel?: () => void
}

const HnSignupForm = ({ portalId, formId, region = 'eu1', onCancel }: HnSignupFormProps) => {
  const formContainerRef = useRef<HTMLDivElement>(null)
  const scriptLoadedRef = useRef(false)

  useEffect(() => {
    if (scriptLoadedRef.current) {
      return
    }

    const script = document.createElement('script')
    script.src = '//js-eu1.hsforms.net/forms/embed/v2.js'
    script.type = 'text/javascript'
    script.async = true

    script.onload = () => {
      if (window.hbspt && formContainerRef.current) {
        window.hbspt.forms.create({
          portalId,
          formId,
          region,
          target: `#${formContainerRef.current.id}`,
        })
      }
    }

    document.body.appendChild(script)
    scriptLoadedRef.current = true

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
      scriptLoadedRef.current = false
    }
  }, [portalId, formId, region])

  return (
    <Grid2 container className={css.container}>
      {/* Left Column - HubSpot Form */}
      <Grid2 size="grow" className={css.formColumn}>
        <div className={css.formWrapper}>
          <Typography variant="h3" fontWeight={700} gutterBottom className={css.formTitle}>
            Request demo
          </Typography>
          <Typography variant="body1" className={css.formSubtitle}>
            Share your details to request a personalized demo call.
          </Typography>
          <div id="hubspot-form-container" ref={formContainerRef} />
          {onCancel && (
            <div className={css.cancelButtonWrapper}>
              <Button variant="text" onClick={onCancel} className={css.cancelButton}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </Grid2>

      {/* Right Column - Background Image */}
      <Grid2 className={css.backgroundColumn} />
    </Grid2>
  )
}

export default HnSignupForm
