import { Paper, Typography } from '@mui/material'
import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    hbspt?: {
      forms: {
        create: (options: {
          portalId: string
          formId: string
          region: string
          target?: string
        }) => void
      }
    }
  }
}

type HubSpotFormProps = {
  portalId: string
  formId: string
}

const HubSpotForm = ({ portalId, formId }: HubSpotFormProps) => {
  const formContainerRef = useRef<HTMLDivElement>(null)
  const scriptLoadedRef = useRef(false)

  useEffect(() => {
    if (scriptLoadedRef.current) {
      return
    }

    const script = document.createElement('script')
    script.src = '//js-eu1.hsforms.net/forms/embed/v2.js'
    script.charset = 'utf-8'
    script.type = 'text/javascript'
    script.async = true

    script.onload = () => {
      if (window.hbspt && formContainerRef.current) {
        window.hbspt.forms.create({
          portalId,
          formId,
          region: 'eu1',
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
    }
  }, [portalId, formId])

  return (
    <div>
      <Typography variant="h3" fontWeight={700} gutterBottom>
        Request demo
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Share your details to verify your request and book your demo call.
      </Typography>
      <Paper sx={{ p: 3, backgroundColor: 'var(--color-static-primary)' }}>
        <div id="hubspot-form-container" ref={formContainerRef} />
      </Paper>
    </div>
  )
}

export default HubSpotForm
