import { Paper, Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'

type HubSpotFormProps = {
  portalId: string
  formId: string
  region?: string
  onSubmit?: () => void
}

const getCalendlyConfig = (): Record<string, string> => {
  try {
    const configString = process.env.NEXT_PUBLIC_HYPERNATIVE_CALENDLY
    if (!configString) {
      console.warn('[HubSpotForm] NEXT_PUBLIC_HYPERNATIVE_CALENDLY not configured')
      return {}
    }
    return JSON.parse(configString)
  } catch (error) {
    console.error('[HubSpotForm] Failed to parse NEXT_PUBLIC_HYPERNATIVE_CALENDLY:', error)
    return {}
  }
}

const HubSpotForm = ({ portalId, formId, region = 'eu1', onSubmit }: HubSpotFormProps) => {
  const formContainerRef = useRef<HTMLDivElement>(null)
  const calendlyContainerRef = useRef<HTMLDivElement>(null)
  const scriptLoadedRef = useRef(false)
  const calendlyScriptLoadedRef = useRef(false)
  const selectedRegionRef = useRef<string>('AMERICAS')
  const [showThankYou, setShowThankYou] = useState(false)

  // Load scripts on mount
  useEffect(() => {
    // Load Calendly CSS
    if (!document.querySelector('link[href*="calendly"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://assets.calendly.com/assets/external/widget.css'
      document.head.appendChild(link)
    }

    // Load Calendly script
    if (!calendlyScriptLoadedRef.current && !document.querySelector('script[src*="calendly"]')) {
      const calendlyScript = document.createElement('script')
      calendlyScript.src = 'https://assets.calendly.com/assets/external/widget.js'
      calendlyScript.async = true
      document.body.appendChild(calendlyScript)
      calendlyScriptLoadedRef.current = true
    }

    // Load HubSpot script
    if (scriptLoadedRef.current) {
      return
    }

    const script = document.createElement('script')
    script.src = 'https://js-eu1.hsforms.net/forms/embed/v2.js'
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
          onFormReady: (form: any) => {
            // Track region selection changes
            form.on('change', '[name="region"]', function (this: HTMLInputElement) {
              selectedRegionRef.current = String(this.value || '').toUpperCase()
            })
          },
          onFormSubmit: () => {
            // Call the onSubmit callback if provided
            onSubmit?.()
            // Show thank you message and Calendly
            setShowThankYou(true)
            return false // Prevent HubSpot's default thank-you redirect
          },
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
    // onSubmit is intentionally excluded from deps as it's only used in onFormSubmit callback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portalId, formId, region])

  // Initialize Calendly when thank you view is shown
  useEffect(() => {
    if (!showThankYou || !calendlyContainerRef.current) {
      return
    }

    const calendlyConfig = getCalendlyConfig()
    const url = calendlyConfig[selectedRegionRef.current] || calendlyConfig['AMERICAS']

    if (!url) {
      console.error('[HubSpotForm] No Calendly URL found for region:', selectedRegionRef.current)
      return
    }

    const startCalendly = () => {
      if (window.Calendly && calendlyContainerRef.current) {
        window.Calendly.initInlineWidget({
          url,
          parentElement: calendlyContainerRef.current,
        })
      }
    }

    if (window.Calendly?.initInlineWidget) {
      startCalendly()
    } else {
      // Poll for Calendly to be available
      const interval = setInterval(() => {
        if (window.Calendly?.initInlineWidget) {
          clearInterval(interval)
          startCalendly()
        }
      }, 100)

      // Cleanup interval if component unmounts
      return () => clearInterval(interval)
    }
  }, [showThankYou])

  return (
    <Paper sx={{ p: 3, backgroundColor: 'var(--color-static-primary)' }}>
      {!showThankYou ? (
        <>
          <Typography variant="h3" fontWeight={700} gutterBottom color="var(--color-static-main)">
            Request demo
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: 'var(--color-static-light)' }}>
            Share your details to verify your request and book your demo call.
          </Typography>
          <div id="hubspot-form-container" ref={formContainerRef} />
        </>
      ) : (
        <>
          <Typography variant="h3" fontWeight={700} gutterBottom color="var(--color-static-main)">
            Thanks! Pick a time that suits you.
          </Typography>
          <div
            ref={calendlyContainerRef}
            style={{
              minWidth: '320px',
              height: '700px',
            }}
          />
        </>
      )}
    </Paper>
  )
}

export default HubSpotForm
