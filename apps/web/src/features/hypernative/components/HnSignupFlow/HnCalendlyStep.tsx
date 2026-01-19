import { useRef, useState, useEffect } from 'react'
import HnSignupLayout from './HnSignupLayout'
import { useCalendly } from '../../hooks/useCalendly'
import css from './styles.module.css'
import { Typography, Skeleton, Button, Box, Stack } from '@mui/material'
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

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
              Something went wrong
            </Typography>
            <Typography variant="body2" className={css.errorMessage}>
              Please reload the page.
            </Typography>
            <Stack direction="column" spacing={2} sx={{ mt: 3 }}>
              <Button
                variant="contained"
                startIcon={<AutorenewRoundedIcon />}
                onClick={handleRefresh}
                className={css.reloadButton}
              >
                Reload
              </Button>
              <Button
                variant="outlined"
                color="static"
                fullWidth
                startIcon={<OpenInNewIcon />}
                onClick={handleOpenInNewTab}
                sx={{ px: 2 }}
              >
                Open in a new tab
              </Button>
            </Stack>
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
