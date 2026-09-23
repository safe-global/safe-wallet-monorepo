import { Lock, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import type { PolicyAccountCount } from '../policyLock'
import { type PolicyCatalogueId } from './catalogue'

export interface PolicyCatalogueTileProps {
  id: PolicyCatalogueId
  title: string
  description: string
  Icon: LucideIcon
  action: string
  onClick: () => void
  /** Renders the plan-gated tile: greyed out, with an account counter next to the icon. */
  locked?: PolicyAccountCount
}

const PolicyCatalogueTile = ({ id, title, description, Icon, action, onClick, locked }: PolicyCatalogueTileProps) => (
  <div data-testid={`policy-catalogue-tile-${id}`} className="flex h-full flex-col gap-3 rounded-xl bg-card p-4">
    <div className={cn('flex flex-1 flex-col gap-2', locked && 'opacity-80')}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex size-10 items-center justify-center rounded-md bg-muted">
          <Icon className="size-4 text-muted-foreground" />
        </div>

        {locked && (
          <Badge variant="subtle" size="status" shape="pill" data-testid="policy-account-count">
            {locked.applied} / {locked.total} Accounts
          </Badge>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Typography variant="paragraph-bold">{title}</Typography>
        <Typography variant="paragraph-small" className="text-muted-foreground">
          {description}
        </Typography>
      </div>
    </div>

    <Button variant="outline" className="w-full" onClick={onClick} aria-label={`${action}: ${title}`}>
      {locked && <Lock aria-hidden data-testid="policy-locked-icon" />}
      {action}
    </Button>
  </div>
)

export default PolicyCatalogueTile
