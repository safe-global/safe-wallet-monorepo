import type { ReactElement } from 'react'
import SafeLogoHalo from '@/components/common/SafeLogoHalo'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyMedia } from '@/components/ui/empty'
import { cn } from '@/utils/cn'
import css from './PoliciesLoadState.module.css'

export const POLICIES_LOAD_ERROR = 'The website failed to load data. Please try again.'

/** Replaces the page body while CGW is answering, with only the heading left above it. */
export const PoliciesLoading = (): ReactElement => (
  <Empty data-testid="policies-loading" role="status" aria-busy aria-live="polite" aria-label="Loading policies">
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

/**
 * CGW either returns every policy in the space or fails; there is no partial response. Showing the
 * rows that did arrive would tell the user that the missing Safes have no policies, when in fact
 * their state is unknown. So a failure replaces the page body rather than reducing the table.
 */
export const PoliciesLoadError = ({ onReload }: { onReload?: () => void }): ReactElement => (
  <Empty data-testid="policies-error" role="alert">
    <EmptyMedia>
      <SafeLogoHalo />
    </EmptyMedia>

    <EmptyDescription>{POLICIES_LOAD_ERROR}</EmptyDescription>

    {onReload && (
      <EmptyContent>
        <Button variant="outline" onClick={onReload}>
          Reload
        </Button>
      </EmptyContent>
    )}
  </Empty>
)
