import { Paper, Typography } from '@mui/material'
import { useEffect, useRef } from 'react'

type HubSpotFormProps = {
  portalId: string
  formId: string
  region?: string
  onSubmit?: (region: string) => void
}

const HubSpotForm = ({ portalId, formId, region = 'eu1', onSubmit }: HubSpotFormProps) => {
  const formContainerRef = useRef<HTMLDivElement>(null)
  const scriptLoadedRef = useRef(false)
  const selectedRegionRef = useRef<string>('AMERICAS')

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
          onFormReady: ($form: any) => {
            try {
              if ($form && typeof $form === 'object' && $form.find) {
                const regionField = $form.find('[name="region"]')
                if (regionField && regionField.length > 0) {
                  const initialValue = regionField.val()
                  if (initialValue) {
                    selectedRegionRef.current = String(initialValue).toUpperCase()
                  }
                  regionField.on('change', function (this: HTMLInputElement) {
                    selectedRegionRef.current = String(this.value || '').toUpperCase()
                  })
                }
              }
            } catch (error) {
              console.warn('[HubSpotForm] Failed to attach region change handler:', error)
            }
          },
          onFormSubmitted: ($form: any, data: any) => {
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
    // onSubmit is intentionally excluded from deps as it's only used in callbacks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portalId, formId, region])

  return (
    <Paper sx={{ py: 1, backgroundColor: 'var(--color-static-primary)' }}>
      <Typography variant="h3" fontWeight={700} gutterBottom color="var(--color-static-main)">
        Request demo
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: 'var(--color-static-light)' }}>
        Share your details to verify your request and book your demo call.
      </Typography>
      <div id="hubspot-form-container" ref={formContainerRef} />
    </Paper>
  )
}

export default HubSpotForm
