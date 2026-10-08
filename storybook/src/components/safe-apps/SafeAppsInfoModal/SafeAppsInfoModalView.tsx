import type { ReactElement, ReactNode } from 'react'
import { Progress as ProgressPrimitive } from '@base-ui/react/progress'
import { cn } from '@/utils/cn'
import { ProgressTrack, ProgressIndicator } from '@/components/ui/progress'

export type SafeAppsInfoModalViewProps = {
  showProgress: boolean
  progressValue: number
  isWarningProgress: boolean
  slider: ReactNode
}

export function SafeAppsInfoModalView({
  showProgress,
  progressValue,
  isWarningProgress,
  slider,
}: SafeAppsInfoModalViewProps): ReactElement {
  return (
    <div className="flex h-[calc(100vh-52px)] flex-col items-center justify-center p-4">
      <div
        data-testid="app-info-modal"
        className="flex max-h-full w-[450px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg"
      >
        {showProgress && (
          <ProgressPrimitive.Root value={progressValue} className="block shrink-0">
            <ProgressTrack className="h-1.5 rounded-none bg-muted">
              <ProgressIndicator
                className={cn(
                  'rounded-lg',
                  isWarningProgress ? 'bg-[var(--color-warning-main)]' : 'bg-[var(--color-primary-main)]',
                )}
              />
            </ProgressTrack>
          </ProgressPrimitive.Root>
        )}
        <div className="flex min-h-0 flex-auto flex-col p-6 text-center">{slider}</div>
      </div>
    </div>
  )
}
