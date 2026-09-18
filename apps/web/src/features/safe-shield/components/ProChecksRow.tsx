import type { ReactElement } from 'react'
import NextLink from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppRoutes } from '@/config/routes'
import { useCurrentSpaceId } from '@/features/spaces'
import ProChip from '@/public/images/safe-pro/pro-chip.svg'

/** Labels the checks that come with Safe Pro; without it, also leads to the Workspace's plans. */
export const ProChecksRow = ({ hasProFeatures }: { hasProFeatures: boolean }): ReactElement => {
  const spaceId = useCurrentSpaceId()
  const href = spaceId ? { pathname: AppRoutes.spaces.plans, query: { spaceId } } : AppRoutes.welcome.spaces

  return (
    <div className="flex items-center justify-between px-3 pt-3 pb-1" data-testid="pro-checks-row">
      <span className="block h-4 w-6" aria-label="Safe Pro">
        <ProChip className="size-full" />
      </span>
      {!hasProFeatures && (
        <Button variant="outline" size="sm" render={<NextLink href={href} />} data-testid="pro-upgrade-link">
          Upgrade
          <ArrowRight data-icon="inline-end" className="text-badge-dot-success" />
        </Button>
      )}
    </div>
  )
}
