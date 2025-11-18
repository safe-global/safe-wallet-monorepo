import { Paper, Typography, CircularProgress, Box } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { trackEvent, HYPERNATIVE_EVENTS } from '@/services/analytics'

type HubSpotFormProps = {
  portalId: string
  formId: string
  region?: string
  safeAddress?: string
  onSubmit?: (region: string) => void
}

const HubSpotForm = ({ portalId, formId, region = 'eu1', safeAddress, onSubmit }: HubSpotFormProps) => {
  const formContainerRef = useRef<HTMLDivElement>(null)
  const scriptLoadedRef = useRef(false)
  const selectedRegionRef = useRef<string>('AMERICAS')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
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
          inlineMessage: '', // Prevent HubSpot's default inline thank you message
          redirectUrl: '', // Prevent HubSpot's redirect
          onFormReady: (form: HTMLFormElement) => {
            try {
              // Hide loader when form is ready
              setIsLoading(false)

              // Pre-populate safe address field using native DOM API
              if (safeAddress && form.elements) {
                const safeAddressField = form.elements.namedItem('safe_address') as HTMLInputElement
                if (safeAddressField) {
                  safeAddressField.value = safeAddress
                  // Trigger change event for HubSpot's internal tracking
                  const changeEvent = new Event('change', { bubbles: true })
                  safeAddressField.dispatchEvent(changeEvent)
                }
              }

              // Track region field changes
              const regionField = form.elements.namedItem('region') as HTMLSelectElement
              if (regionField) {
                const initialValue = regionField.value
                if (initialValue) {
                  selectedRegionRef.current = String(initialValue).toUpperCase()
                }
                regionField.addEventListener('change', (e) => {
                  selectedRegionRef.current = String((e.target as HTMLSelectElement).value || '').toUpperCase()
                })
              }
            } catch (error) {
              console.warn('[HubSpotForm] Error in onFormReady:', error)
            }
          },
          onFormSubmitted: ($form: any, data: any) => {
            // Track form submission event (sent to mixpanel as well via the GA_TO_MIXPANEL_MAPPING in services/analytics/)
            trackEvent(HYPERNATIVE_EVENTS.GUARDIAN_FORM_SUBMITTED)

            if (data) {
              let regionValue: string | undefined

              if (Array.isArray(data)) {
                const regionField = data.find((field: any) => field.name === 'region')
                regionValue = regionField?.value
              } else if (typeof data === 'object') {
                if (data.submissionValues) {
                  if (Array.isArray(data.submissionValues)) {
                    const regionField = data.submissionValues.find((field: any) => field.name === 'region')
                    regionValue = regionField?.value
                  } else if (typeof data.submissionValues === 'object') {
                    regionValue = data.submissionValues.region
                  }
                } else {
                  regionValue = data.region || data.region_of_operation
                }
              }

              if (regionValue) {
                selectedRegionRef.current = String(regionValue).toUpperCase()
              }
            }

            onSubmit?.(selectedRegionRef.current)
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
    // onSubmit and safeAddress are intentionally excluded from deps as they're only used in callbacks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portalId, formId, region])

  return (
    <Paper sx={{ py: 1, backgroundColor: 'var(--color-static-primary)', minHeight: '100%' }}>
      <Typography variant="h3" fontWeight={700} gutterBottom color="var(--color-static-main)">
        Request demo
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: 'var(--color-static-light)' }}>
<<<<<<< HEAD
        Share your details to verify your request and book your demo call.
=======
        Share your details to book a demo call.
>>>>>>> origin/main
      </Typography>
      {isLoading && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
          }}
        >
          <CircularProgress sx={{ color: 'var(--color-static-main)' }} />
        </Box>
      )}
      <div id="hubspot-form-container" ref={formContainerRef} style={{ display: isLoading ? 'none' : 'block' }} />
    </Paper>
  )
}

export default HubSpotForm
