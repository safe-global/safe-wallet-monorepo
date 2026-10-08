import type { ReactElement } from 'react'
import { cn } from '@/utils/cn'
import css from './LaunchScreen.module.css'

export const LAUNCH_STEPS = [
  { progress: 30, caption: 'Loading Safe{Wallet}…' },
  { progress: 65, caption: 'Fetching your accounts…' },
  { progress: 90, caption: 'Almost there…' },
] as const

export type LaunchScreenViewProps = {
  exiting: boolean
  heldForStepUp: boolean
  stepIndex: number
  stepUpCaption?: string
}

export function LaunchScreenView({
  exiting,
  heldForStepUp,
  stepIndex,
  stepUpCaption,
}: LaunchScreenViewProps): ReactElement {
  const { progress, caption } = LAUNCH_STEPS[stepIndex]

  return (
    <div
      role="status"
      aria-busy={!exiting}
      aria-live="polite"
      aria-label={stepUpCaption ?? 'Loading Safe{Wallet}'}
      data-testid="launch-screen"
      className={cn(
        'fixed inset-0 z-[1401] flex flex-col items-center justify-center gap-8 bg-background transition-opacity duration-300',
        exiting && 'pointer-events-none opacity-0',
      )}
    >
      <div className="relative flex items-center justify-center">
        <span aria-hidden className={cn('absolute size-40 rounded-full', css.halo)} />
        <div className={css.breathe}>
          <img src="/images/logo-no-text.svg" alt="Safe" width={72} height={72} className="size-[72px] dark:hidden" />
          <span aria-hidden className={cn('hidden size-[72px] dark:block', css.logoDarkFill)} />
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        {!heldForStepUp && (
          <div className="h-1 w-40 overflow-hidden rounded-full bg-secondary">
            <div
              data-testid="launch-progress-bar"
              className={cn('h-full rounded-full', css.bar)}
              style={{ width: `${exiting ? 100 : progress}%`, backgroundColor: 'var(--color-static-text-brand)' }}
            />
          </div>
        )}
        <p className="min-h-5 text-sm text-muted-foreground">{stepUpCaption ?? caption}</p>
      </div>
    </div>
  )
}
