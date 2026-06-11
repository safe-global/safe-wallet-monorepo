import type { ReactElement } from 'react'
import { cn } from '@/utils/cn'
import css from './LaunchScreen.module.css'

export interface LaunchScreenViewProps {
  /** Decorative progress, 0–100. */
  progress?: number
  /** Caption under the progress bar. */
  caption?: string
  /** When true, fades the overlay out (used by the container before unmount). */
  exiting?: boolean
}

/**
 * Presentational, always-rendered boot splash: breathing Safe logo over a brand-green
 * halo, an eased progress bar, and a caption. The brand green uses the theme-independent
 * `--color-static-text-brand` static token (NOT `--primary`, which is near-black in light mode).
 */
function LaunchScreenView({ progress = 0, caption = '', exiting = false }: LaunchScreenViewProps): ReactElement {
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
          {/* Light mode: the dark-coloured logo asset. Dark mode: masked + filled with the theme primary (green). */}
          <img src="/images/logo-no-text.svg" alt="Safe" width={72} height={72} className="size-[72px] dark:hidden" />
          <span aria-hidden className={cn('hidden size-[72px] dark:block', css.logoDarkFill)} />
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="h-1 w-40 overflow-hidden rounded-full bg-secondary">
          <div
            data-testid="launch-progress-bar"
            className={cn('h-full rounded-full', css.bar)}
            style={{ width: `${progress}%`, backgroundColor: 'var(--color-static-text-brand)' }}
          />
        </div>
        <p className="min-h-5 text-sm text-muted-foreground">{caption}</p>
      </div>
    </div>
  )
}

export default LaunchScreenView
