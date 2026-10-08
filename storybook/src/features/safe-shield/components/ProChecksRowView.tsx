import type { ComponentProps, ReactElement } from 'react'
import NextLink from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ProChip from '@/public/images/safe-pro/pro-chip.svg'

export type ProChecksRowViewProps = {
  hasProFeatures: boolean
  href: ComponentProps<typeof NextLink>['href']
  onUpgradeClick: () => void
}

export const ProChecksRowView = ({ hasProFeatures, href, onUpgradeClick }: ProChecksRowViewProps): ReactElement => {
  return (
    <div className="flex min-h-11 items-center justify-between rounded-t-md bg-muted p-2" data-testid="pro-checks-row">
      <span className="block h-5 w-8" aria-label="Safe Pro">
        <ProChip className="size-full" />
      </span>
      {!hasProFeatures && (
        <Button
          variant="outline"
          size="xs"
          render={<NextLink href={href} />}
          data-testid="pro-upgrade-link"
          onClick={onUpgradeClick}
        >
          Upgrade
          <ArrowRight data-icon="inline-end" className="text-badge-dot-success" />
        </Button>
      )}
    </div>
  )
}
