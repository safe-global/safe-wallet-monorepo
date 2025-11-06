import { Paper, Typography } from '@mui/material'
import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    hbspt?: {
      forms: {
        create: (options: { portalId: string; formId: string; region: string; target?: string }) => void
      }
    }
  }
}

type HubSpotFormProps = {
  portalId: string
  formId: string
  region?: string
}

const HubSpotForm = ({ portalId, formId, region = 'eu1' }: HubSpotFormProps) => {
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
    <Paper sx={{ p: 3, backgroundColor: 'var(--color-static-primary)' }}>
      <Typography variant="h3" fontWeight={700} gutterBottom color="var(--color-static-main)">
        Request demo
      </Typography>
      <Typography variant="body1" sx={{ mb: 2, color: 'var(--color-static-light)' }}>
        Share your details to verify your request and book your demo call.
      </Typography>
      <div id="hubspot-form-container" ref={formContainerRef} />
    </Paper>
  )
}

export default HubSpotForm
