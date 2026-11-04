import type { ReactElement } from 'react'
import SafeLogoHalo from '@safe-global/views/components/common/SafeLogoHalo'
import { Button } from '@safe-global/views/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyMedia } from '@safe-global/views/components/ui/empty'
import { cn } from '@safe-global/views/utils/cn'
import css from './LoadState.module.css'

export const SPACE_LOAD_ERROR = 'The website failed to load data. Please try again.'

type LoadStateProps = {
  /** What is loading, for the busy label. */
  subject: string
  testId: string
}

export const SpaceLoading = ({ subject, testId }: LoadStateProps): ReactElement => (
  <Empty data-testid={testId} role="status" aria-busy aria-live="polite" aria-label={`Loading ${subject}`}>
    <EmptyMedia>
      <SafeLogoHalo />
    </EmptyMedia>

    <EmptyContent>
      <div className="h-1 w-40 overflow-hidden rounded-full bg-secondary">
        <div className={cn('h-full rounded-full bg-[var(--color-static-text-brand)]', css.bar)} />
      </div>
    </EmptyContent>

    <EmptyDescription>Almost there…</EmptyDescription>
  </Empty>
)

/** A failure replaces the body: a partial table would read as "the rest do not exist". */
export const SpaceLoadError = ({ onReload, testId }: { onReload?: () => void; testId: string }): ReactElement => (
  <Empty data-testid={testId} role="alert">
    <EmptyMedia>
      <SafeLogoHalo />
    </EmptyMedia>

    <EmptyDescription>{SPACE_LOAD_ERROR}</EmptyDescription>

    {onReload && (
      <EmptyContent>
        <Button variant="outline" onClick={onReload}>
          Reload
        </Button>
      </EmptyContent>
    )}
  </Empty>
)
