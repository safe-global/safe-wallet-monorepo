import { Grid2 } from '@mui/material'
import { useEffect, useRef } from 'react'
import css from './styles.module.css'

export type HnCalendlyStepProps = {
  calendlyUrl: string
}

const HnCalendlyStep = ({ calendlyUrl }: HnCalendlyStepProps) => {
  const calendlyContainerRef = useRef<HTMLDivElement>(null)
  const calendlyScriptLoadedRef = useRef(false)

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
  }, [])

  useEffect(() => {
    if (!calendlyContainerRef.current || !calendlyUrl) {
      return
    }

    const startCalendly = () => {
      if (window.Calendly && calendlyContainerRef.current) {
        window.Calendly.initInlineWidget({
          url: calendlyUrl,
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
  }, [calendlyUrl])

  return (
    <Grid2 container className={css.container}>
      {/* Left Column - Calendly */}
      <Grid2 size="grow" className={css.calendlyColumn}>
        <div className={css.calendlyWrapper}>
          <div ref={calendlyContainerRef} className={css.calendlyContainer} />
        </div>
      </Grid2>

      {/* Right Column - Background Image */}
      <Grid2 className={css.backgroundColumn} />
    </Grid2>
  )
}

export default HnCalendlyStep
