import type { ReactElement } from 'react'
import NextLink from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppRoutes } from '@/config/routes'
import { useSafeProAccess } from '@/features/spaces'
import ProChip from '@/public/images/safe-pro/pro-chip.svg'

export const ProChecksRow = ({
  hasProFeatures,
  variant = 'chip',
}: {
  hasProFeatures: boolean
  /** `divider`: a labelled rule inside the Safenet prototype's single grey panel. */
  variant?: 'chip' | 'divider'
}): ReactElement => {
  const { spaceId } = useSafeProAccess()
  const href = spaceId ? { pathname: AppRoutes.spaces.plans, query: { spaceId } } : AppRoutes.welcome.spaces

  if (variant === 'divider') {
    return (
      <div className="flex items-center gap-2 px-2 pt-2 pb-1.5" data-testid="pro-checks-row">
        <span className="text-[10px] leading-4 font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          Pro checks
        </span>
        <span className="h-px flex-1 bg-border" aria-hidden />
        {!hasProFeatures && (
          <NextLink
            href={href}
            data-testid="pro-upgrade-link"
            className="inline-flex items-center gap-1 rounded-sm text-[11px] leading-4 font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            Upgrade
            <ArrowRight className="size-3 text-badge-dot-success" aria-hidden />
          </NextLink>
        )}
      </div>
    )
  }

  return (
    <div className="flex min-h-11 items-center justify-between rounded-t-md bg-muted p-2" data-testid="pro-checks-row">
      <span className="block h-5 w-8" aria-label="Safe Pro">
        <ProChip className="size-full" />
      </span>
      {!hasProFeatures && (
        <Button variant="outline" size="xs" render={<NextLink href={href} />} data-testid="pro-upgrade-link">
          Upgrade
          <ArrowRight data-icon="inline-end" className="text-badge-dot-success" />
        </Button>
      )}
    </div>
  )
}
