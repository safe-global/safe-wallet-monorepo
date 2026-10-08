import { useDarkMode } from '@/hooks/useDarkMode'
import { useEffect, useRef, useState, type ReactElement } from 'react'
import { SafeShieldAnalysisLoadingView } from '@views/features/safe-shield/components/SafeShieldContent/SafeShieldAnalysisLoadingView'

interface SafeShieldAnalysisLoadingProps {
  loading: boolean
  analysesEmpty: boolean
}

export const SafeShieldAnalysisLoading = ({ analysesEmpty, loading }: SafeShieldAnalysisLoadingProps): ReactElement => {
  const [progress, setProgress] = useState(30)
  const [delayedAnalysesEmpty, setDelayedAnalysesEmpty] = useState(analysesEmpty)
  const isDarkMode = useDarkMode()
  const showSkeleton = loading && delayedAnalysesEmpty
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

  useEffect(() => {
    if (analysesEmpty) {
      setDelayedAnalysesEmpty(true)
      return
    }

    const timeoutId = setTimeout(() => {
      setDelayedAnalysesEmpty(false)
    }, 500)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [analysesEmpty])

  return (
    <SafeShieldAnalysisLoadingView
      isDarkMode={isDarkMode}
      progress={progress}
      loading={loading}
      showSkeleton={showSkeleton}
    />
  )
}
