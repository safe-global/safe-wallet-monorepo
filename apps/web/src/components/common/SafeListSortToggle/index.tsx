import type { ComponentProps } from 'react'
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
import { useAppDispatch, useAppSelector } from '@/store'
import { OrderByOption, selectOrderByPreference, setOrderByPreference } from '@/store/orderByPreferenceSlice'
import { cn } from '@/utils/cn'

const labels: Record<OrderByOption, string> = {
  [OrderByOption.NAME]: 'Name',
  [OrderByOption.LAST_VISITED]: 'Last visited',
  [OrderByOption.MANUAL]: 'Manual',
}

/**
 * Sort control for the Safe lists (account selector dropdown + All accounts modal).
 * Reads/writes the shared, persisted orderByPreference so every Safe list stays in sync.
 *
 * @param className - Overrides the trigger's border/shadow/hover. Defaults suit card and dialog
 *   surfaces; on the muted page background pass `border-border shadow-xs` plus
 *   `hover:bg-foreground/[0.06]`, where the `bg-muted` hover would be invisible.
 * @param size - Match the other controls on the row (e.g. `lg` beside a `size="lg"` CTA and an
 *   `inputSize="lg"` search field).
 */
const SafeListSortToggle = ({
  className,
  size = 'default',
}: {
  className?: string
  size?: ComponentProps<typeof Button>['size']
}) => {
  const dispatch = useAppDispatch()
  const { orderBy } = useAppSelector(selectOrderByPreference)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size={size}
            className={cn(
              'w-[160px] shrink-0 justify-between gap-1.5 border-border shadow-none text-foreground hover:bg-muted aria-expanded:bg-muted',
              className,
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
          <DropdownMenuRadioGroup
            value={orderBy}
            onValueChange={(value) => dispatch(setOrderByPreference({ orderBy: value as OrderByOption }))}
          >
            <DropdownMenuRadioItem value={OrderByOption.NAME}>{labels[OrderByOption.NAME]}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value={OrderByOption.LAST_VISITED}>
              {labels[OrderByOption.LAST_VISITED]}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value={OrderByOption.MANUAL}>{labels[OrderByOption.MANUAL]}</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default SafeListSortToggle
