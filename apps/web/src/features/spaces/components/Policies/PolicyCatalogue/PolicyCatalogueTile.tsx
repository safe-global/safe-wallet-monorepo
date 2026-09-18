import { ArrowRight, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { type PolicyCatalogueId } from './catalogue'

/** How many of the workspace's Safe accounts have this policy. What is counted is open in WA-3552. */
export type PolicyAccountCount = {
  applied: number
  total: number
}

export interface PolicyCatalogueTileProps {
  id: PolicyCatalogueId
  title: string
  description: string
  Icon: LucideIcon
  isAvailable: boolean
  onClick: () => void
  /** Renders the plan-gated tile: an account counter and a Set policy button instead of the arrow. */
  locked?: PolicyAccountCount
}

const LockedPolicyCatalogueTile = ({
  id,
  title,
  description,
  Icon,
  onClick,
  locked,
}: PolicyCatalogueTileProps & { locked: PolicyAccountCount }) => (
  <div data-testid={`policy-catalogue-tile-${id}`} className="flex h-full flex-col gap-3 rounded-xl bg-card p-4">
    <div className="flex items-start justify-between gap-2">
      <div className="flex size-10 items-center justify-center rounded-md bg-accent">
        <Icon className="size-4 text-accent-success" />
      </div>

      <Badge variant="secondary" size="status" shape="status" data-testid="policy-account-count">
        {locked.applied} / {locked.total} Accounts
      </Badge>
    </div>

    <div className="flex flex-1 flex-col gap-1">
      <Typography variant="paragraph-bold">{title}</Typography>
      <Typography variant="paragraph-small" className="text-muted-foreground">
        {description}
      </Typography>
    </div>

    <Button variant="outline" className="w-full" onClick={onClick}>
      Set policy
    </Button>
  </div>
)

const PolicyCatalogueTile = (props: PolicyCatalogueTileProps) => {
  if (props.locked) return <LockedPolicyCatalogueTile {...props} locked={props.locked} />

  const { id, title, description, Icon, isAvailable, onClick } = props

  return (
    <button
      type="button"
      data-testid={`policy-catalogue-tile-${id}`}
      aria-disabled={isAvailable ? undefined : true}
      onClick={onClick}
      className={cn(
        'flex h-full flex-col items-start gap-2 rounded-xl bg-card p-4 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isAvailable ? 'cursor-pointer hover:bg-[var(--color-background-secondary)]' : 'cursor-default',
      )}
    >
      <div
        className={cn('flex size-10 items-center justify-center rounded-md bg-accent', !isAvailable && 'opacity-60')}
      >
        <Icon className="size-4 text-accent-success" />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <Typography variant="paragraph-bold" className={cn(!isAvailable && 'text-muted-foreground')}>
            {title}
          </Typography>

          {isAvailable ? (
            <ArrowRight className="size-4 shrink-0" aria-hidden />
          ) : (
            <Badge variant="secondary" size="sm">
              Soon
            </Badge>
          )}
        </div>

        <Typography variant="paragraph-small" className="text-muted-foreground">
          {description}
        </Typography>
      </div>
    </button>
  )
}

export default PolicyCatalogueTile
