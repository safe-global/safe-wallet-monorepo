import { useRef, useState, useEffect } from 'react'
import HnSignupLayout from './HnSignupLayout'
import { useCalendly } from '../../hooks/useCalendly'
import css from './styles.module.css'
import { Typography } from '@/components/ui/typography'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { RotateCw, ExternalLink as OpenInNewIcon } from 'lucide-react'

export type HnCalendlyStepProps = {
  calendlyUrl: string
  onBookingScheduled?: () => void
}

const SKELETON_DURATION_MS = 1500
// Static skeleton color as the widget bg is always white (theme-independent)
const SKELETON_COLOR = '#dddee0'

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
    <HnSignupLayout contentClassName={css.calendlyColumn}>
      <div className={css.calendlyWrapper}>
        {hasError ? (
          <div className={css.errorContainer}>
            <Typography variant="h3" className={css.errorTitle}>
              Something went wrong
            </Typography>
            <Typography variant="paragraph-small" className={css.errorMessage}>
              Please reload the page.
            </Typography>
            <div className="mt-6 flex flex-col gap-4">
              <Button onClick={handleRefresh} className={css.reloadButton}>
                <RotateCw />
                Reload
              </Button>
              <Button variant="outline" onClick={handleOpenInNewTab} className="w-full">
                <OpenInNewIcon />
                Open in a new tab
              </Button>
            </div>
          </div>
        ) : (
          <>
            {showSkeleton && (
              <div className={css.calendlySkeletonOverlay}>
                <Skeleton className="mb-4 h-10 w-full rounded-md" style={{ backgroundColor: SKELETON_COLOR }} />
                <Skeleton className="h-10 w-full rounded-md" style={{ backgroundColor: SKELETON_COLOR }} />
              </div>
            )}
            <div
              ref={widgetRef}
              id="calendly-widget"
              className={`${css.calendlyWidget} ${!isSecondStep ? css.calendlyWidgetWithHeader : ''}`}
            />
          </>
        )}
      </div>
    </HnSignupLayout>
  )
}

export default HnCalendlyStep
