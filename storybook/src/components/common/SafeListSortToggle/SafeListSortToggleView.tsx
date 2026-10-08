import type { ComponentProps, ReactElement } from 'react'
import { ArrowDownUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/utils/cn'

/** Mirrors OrderByOption in the store */
export type SafeListOrderBy = 'name' | 'lastVisited' | 'manual'

const labels: Record<SafeListOrderBy, string> = {
  name: 'Name',
  lastVisited: 'Last visited',
  manual: 'Manual',
}

export type SafeListSortToggleViewProps = {
  orderBy: SafeListOrderBy
  onOrderByChange: (orderBy: SafeListOrderBy) => void
  triggerClassName?: string
  size?: ComponentProps<typeof Button>['size']
}

export function SafeListSortToggleView({
  orderBy,
  onOrderByChange,
  triggerClassName,
  size = 'default',
}: SafeListSortToggleViewProps): ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size={size}
            className={cn(
              'w-[160px] shrink-0 justify-between gap-1.5 border-border shadow-none text-foreground hover:bg-muted aria-expanded:bg-muted',
              triggerClassName,
            )}
            data-testid="safe-list-sort-toggle"
          />
        }
      >
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <ArrowDownUp className="size-4 shrink-0" />
          {labels[orderBy]}
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={orderBy} onValueChange={(value) => onOrderByChange(value as SafeListOrderBy)}>
            <DropdownMenuRadioItem value="name">{labels.name}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="lastVisited">{labels.lastVisited}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="manual">{labels.manual}</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
