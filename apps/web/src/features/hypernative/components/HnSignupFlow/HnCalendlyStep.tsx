import { useRef, useState, useEffect } from 'react'
import HnSignupLayout from './HnSignupLayout'
import { useCalendly } from '../../hooks/useCalendly'
import css from './styles.module.css'
import { Typography, Skeleton, Button, Box } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'

export type HnCalendlyStepProps = {
  calendlyUrl: string
  onBookingScheduled?: () => void
}

const SKELETON_DURATION_MS = 1500
// Static skeleton color as the widget bg is always white (theme-independent)
const SKELETON_COLOR = '#dddee0'

const HnCalendlyStep = ({ calendlyUrl, onBookingScheduled }: HnCalendlyStepProps) => {
  const widgetRef = useRef<HTMLDivElement>(null)
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
    }
  }, [hasError])

  const handleRefresh = () => {
    refresh()
    setShowSkeleton(true)
    setTimeout(() => {
      setShowSkeleton(false)
    }, SKELETON_DURATION_MS)
  }

  return (
    <HnSignupLayout contentClassName={css.calendlyColumn}>
      <div className={css.calendlyWrapper}>
        {!isSecondStep && !hasError && (
          <div className={css.calendlyHeader}>
            <Typography variant="h2" className={css.calendlyTitle}>
              Get connected to the right expert
            </Typography>
          </div>
        )}
        {hasError ? (
          <Box className={css.errorContainer}>
            <Typography variant="h3" className={css.errorTitle}>
              Unable to load scheduling widget
            </Typography>
            <Typography variant="body2" className={css.errorMessage}>
              There was a problem loading the Calendly widget. Please try refreshing or check your internet connection.
            </Typography>
            <Button variant="contained" startIcon={<RefreshIcon />} onClick={handleRefresh} sx={{ mt: 3 }}>
              Refresh
            </Button>
          </Box>
        ) : (
          <>
            {showSkeleton && (
              <div className={css.calendlySkeletonOverlay}>
                <Skeleton variant="rounded" width="100%" height="40px" sx={{ mb: 2, bgcolor: SKELETON_COLOR }} />
                <br />
                <Skeleton
                  variant="rounded"
                  sx={{
                    width: { sm: '100%', md: '160px' },
                    bgcolor: SKELETON_COLOR,
                  }}
                  height="40px"
                />
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
