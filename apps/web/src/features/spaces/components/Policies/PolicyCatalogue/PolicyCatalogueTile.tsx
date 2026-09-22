import { type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { type PolicyCatalogueId } from './catalogue'

export interface PolicyCatalogueTileProps {
  id: PolicyCatalogueId
  title: string
  description: string
  Icon: LucideIcon
  action: string
  onClick: () => void
}

const PolicyCatalogueTile = ({ id, title, description, Icon, action, onClick }: PolicyCatalogueTileProps) => (
  <div data-testid={`policy-catalogue-tile-${id}`} className="flex h-full flex-col gap-3 rounded-xl bg-card p-4">
    <div className="flex flex-1 flex-col gap-2">
      <div className="flex size-10 items-center justify-center rounded-md bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>

      <div className="flex flex-col gap-1">
        <Typography variant="paragraph-bold">{title}</Typography>
        <Typography variant="paragraph-small" className="text-muted-foreground">
          {description}
        </Typography>
      </div>
    </div>

    <Button variant="outline" className="w-full" onClick={onClick} aria-label={`${action}: ${title}`}>
      {action}
    </Button>
  </div>
)

export default PolicyCatalogueTile
