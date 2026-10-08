import { ProgressBar } from '@/components/common/ProgressBar'
import { ChevronDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { type ReactElement } from 'react'

export interface SafeShieldAnalysisLoadingViewProps {
  isDarkMode: boolean
  progress: number
  loading: boolean
  showSkeleton: boolean
}

export const SafeShieldAnalysisLoadingView = ({
  isDarkMode,
  progress,
  loading,
  showSkeleton,
}: SafeShieldAnalysisLoadingViewProps): ReactElement => {
  const color = isDarkMode ? 'primary' : 'secondary'

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
