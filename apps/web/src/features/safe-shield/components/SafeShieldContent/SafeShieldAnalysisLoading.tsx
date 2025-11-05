import { ProgressBar } from '@/components/common/ProgressBar'
import { KeyboardArrowDown } from '@mui/icons-material'
import { Box, Skeleton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useEffect, useRef, useState, type ReactElement } from 'react'

interface SafeShieldAnalysisLoadingProps {
  loading: boolean
  isRecipientEmpty: boolean
}

export const SafeShieldAnalysisLoading = ({
  isRecipientEmpty,
  loading,
}: SafeShieldAnalysisLoadingProps): ReactElement => {
  const theme = useTheme()
  const [progress, setProgress] = useState(30)
  const isDarkMode = theme.palette.mode === 'dark'
  const color = isDarkMode ? 'primary' : 'secondary'
  const showSkeleton = loading && isRecipientEmpty
  const hasStarted = useRef(false)

  useEffect(() => {
    if (hasStarted.current) return

    hasStarted.current = true

    let interval: NodeJS.Timeout

    if (!loading) {
      setTimeout(() => {
        clearTimeout(interval)
        setProgress(30)
      }, 300)
    }

    const animation = () => {
      interval = setTimeout(() => {
        setProgress(100)
      }, 100)
    }

    animation()

    return () => {
      clearTimeout(interval)
    }
  }, [loading])

  return (
    <>
      <Box position="absolute" top={0} width="100%" zIndex={2} left={0}>
        <ProgressBar
          color={color}
          value={progress}
          sx={{ opacity: loading ? 1 : 0, transition: 'opacity 0.3s ease-out' }}
        />
      </Box>

      {showSkeleton && (
        <Box p="1rem 12px">
          <Box display="flex" flexDirection="row" gap={1} alignItems="center">
            <Skeleton variant="rounded" width="1rem" height="1rem" />
            <Skeleton variant="rounded" width="100%" height={10} />
            <KeyboardArrowDown sx={{ width: 16, height: 16, color: 'text.secondary' }} />
          </Box>
        </Box>
      )}
    </>
  )
}
