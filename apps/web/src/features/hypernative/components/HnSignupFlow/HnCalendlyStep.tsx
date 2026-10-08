import { useRef, useState, useEffect } from 'react'
import { useCalendly } from '../../hooks/useCalendly'
import { HnCalendlyStepView } from '@views/features/hypernative/components/HnSignupFlow/HnCalendlyStepView'

export type HnCalendlyStepProps = {
  calendlyUrl: string
  onBookingScheduled?: () => void
}

const SKELETON_DURATION_MS = 1500

const HnCalendlyStep = ({ calendlyUrl, onBookingScheduled }: HnCalendlyStepProps) => {
  const widgetRef = useRef<HTMLDivElement>(null)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { isSecondStep, hasError, refresh } = useCalendly(widgetRef, calendlyUrl, onBookingScheduled)
  const [showSkeleton, setShowSkeleton] = useState(true)

  // Show skeleton (we can't get from Calendly when the widget is loaded, hence a fixed timeout)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkeleton(false)
    }, SKELETON_DURATION_MS)

    return () => {
      clearTimeout(timer)
    }
  }, [])

  // Hide skeleton when error occurs
  useEffect(() => {
    if (hasError) {
      setShowSkeleton(false)
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
        refreshTimeoutRef.current = null
      }
    }
  }, [hasError])

  // Cleanup refresh timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])

  const handleRefresh = () => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }
    refresh()
    setShowSkeleton(true)
    refreshTimeoutRef.current = setTimeout(() => {
      setShowSkeleton(false)
      refreshTimeoutRef.current = null
    }, SKELETON_DURATION_MS)
  }

  const handleOpenInNewTab = () => {
    window.open(calendlyUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <HnCalendlyStepView
      widgetRef={widgetRef}
      hasError={hasError}
      showSkeleton={showSkeleton}
      isSecondStep={isSecondStep}
      onRefresh={handleRefresh}
      onOpenInNewTab={handleOpenInNewTab}
    />
  )
}

export default HnCalendlyStep
