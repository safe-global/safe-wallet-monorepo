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

const labels: Record<OrderByOption, string> = {
  [OrderByOption.NAME]: 'Name',
  [OrderByOption.LAST_VISITED]: 'Most recent',
}

/**
 * Sort control for the Safe lists (account selector dropdown + All accounts modal).
 * Reads/writes the shared, persisted orderByPreference so every Safe list stays in sync.
 */
const SafeListSortToggle = () => {
  const dispatch = useAppDispatch()
  const { orderBy } = useAppSelector(selectOrderByPreference)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            // Match the adjacent search InputGroup exactly: h-9, rounded-md, border-gray-100, shadow-none.
            // Fixed width so the trigger doesn't grow/shrink between "Name" and "Most recent".
            size="default"
            className="h-9 w-[160px] shrink-0 justify-between gap-1.5 rounded-md border-gray-100 shadow-none text-muted-foreground"
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
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default SafeListSortToggle
