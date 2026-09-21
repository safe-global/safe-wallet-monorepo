import { ArrowRight, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { type PolicyCatalogueId } from './catalogue'

export interface PolicyCatalogueTileProps {
  id: PolicyCatalogueId
  title: string
  description: string
  Icon: LucideIcon
  isAvailable: boolean
  onClick: () => void
}

const PolicyCatalogueTile = ({ id, title, description, Icon, isAvailable, onClick }: PolicyCatalogueTileProps) => (
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
    <div className={cn('flex size-10 items-center justify-center rounded-md bg-accent', !isAvailable && 'opacity-60')}>
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

export default PolicyCatalogueTile
