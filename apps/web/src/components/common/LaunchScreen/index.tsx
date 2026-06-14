import { useEffect, useState, type ReactElement } from 'react'
import { cn } from '@/utils/cn'
import { useLaunchScreen } from './useLaunchScreen'
import css from './LaunchScreen.module.css'

const LAUNCH_STEPS = [
  { progress: 30, caption: 'Loading your workspace…' },
  { progress: 65, caption: 'Fetching your accounts…' },
  { progress: 90, caption: 'Almost there…' },
] as const

const STEP_INTERVAL_MS = 700
const EXIT_DURATION_MS = 300

/**
 * App-boot launch screen: a full-screen branded splash shown from first mount until the app
 * shell is ready (see {@link useLaunchScreen}), then faded out and unmounted. Mounted once in
 * `_app`, so it never replays on client-side navigations.
 */
function LaunchScreen(): ReactElement | null {
  const { visible } = useLaunchScreen()
  const [rendered, setRendered] = useState(true)
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    if (!visible) return
    const id = setInterval(
      () => setStepIndex((index) => Math.min(index + 1, LAUNCH_STEPS.length - 1)),
      STEP_INTERVAL_MS,
    )
    return () => clearInterval(id)
  }, [visible])

  useEffect(() => {
    if (visible) return
    const id = setTimeout(() => setRendered(false), EXIT_DURATION_MS)
    return () => clearTimeout(id)
  }, [visible])

  if (!rendered) return null

  const exiting = !visible
  const { progress, caption } = LAUNCH_STEPS[stepIndex]

  return (
    <div
      role="status"
      aria-busy={!exiting}
      aria-live="polite"
      aria-label="Loading Safe{Wallet}"
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
        <div className="h-1 w-40 overflow-hidden rounded-full bg-secondary">
          <div
            data-testid="launch-progress-bar"
            className={cn('h-full rounded-full', css.bar)}
            style={{ width: `${exiting ? 100 : progress}%`, backgroundColor: 'var(--color-static-text-brand)' }}
          />
        </div>
        <p className="min-h-5 text-sm text-muted-foreground">{caption}</p>
      </div>
    </div>
  )
}

export default LaunchScreen
