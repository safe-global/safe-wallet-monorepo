import { ProgressBar } from '@/components/common/ProgressBar'
import { ChevronDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useEffect, useRef, useState, type ReactElement } from 'react'

interface SafeShieldAnalysisLoadingProps {
  loading: boolean
  analysesEmpty: boolean
}

export const SafeShieldAnalysisLoading = ({ analysesEmpty, loading }: SafeShieldAnalysisLoadingProps): ReactElement => {
  const [progress, setProgress] = useState(30)
  const [delayedAnalysesEmpty, setDelayedAnalysesEmpty] = useState(analysesEmpty)
  const isDarkMode = useDarkMode()
  const color = isDarkMode ? 'primary' : 'secondary'
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
    <>
      <div className="absolute top-0 left-0 z-[2] w-full">
        <ProgressBar
          color={color}
          value={progress}
          sx={{ opacity: loading ? 1 : 0, transition: 'opacity 0.3s ease-out' }}
        />
      </div>

      {showSkeleton && (
        <div className="px-3 py-4">
          <div className="flex flex-row items-center gap-2">
            <Skeleton className="size-4 rounded-md" />
            <Skeleton className="h-2.5 w-full rounded-md" />
            <ChevronDown className="size-4 text-[var(--color-text-secondary)]" />
          </div>
        </div>
      )}
    </>
  )
}
