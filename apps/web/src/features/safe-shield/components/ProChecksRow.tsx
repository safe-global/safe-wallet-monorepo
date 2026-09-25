import type { ReactElement } from 'react'
import NextLink from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppRoutes } from '@/config/routes'
import { useSafeProAccess } from '@/features/spaces'
import ProChip from '@/public/images/safe-pro/pro-chip.svg'

export const ProChecksRow = ({ hasProFeatures }: { hasProFeatures: boolean }): ReactElement => {
  const { spaceId } = useSafeProAccess()
  const href = spaceId ? { pathname: AppRoutes.spaces.plans, query: { spaceId } } : AppRoutes.welcome.spaces

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
