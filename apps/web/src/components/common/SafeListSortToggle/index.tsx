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
import type { OrderByOption, SortOption } from '@/store/orderByPreferenceSlice'
import { BASIC_SORT_OPTIONS, selectOrderByPreference, setOrderByPreference } from '@/store/orderByPreferenceSlice'

// base-ui fires onValueChange even on re-select; return null then to avoid clobbering a balance order set elsewhere.
export const sortChangeAction = (next: string, activeValue: OrderByOption) =>
  next === activeValue ? null : setOrderByPreference({ orderBy: next as OrderByOption })

interface SafeListSortToggleProps {
  /** Sort options to offer. Defaults to the basic set; pass ALL_SORT_OPTIONS where balances are eager-loaded. */
  options?: SortOption[]
}

/**
 * Sort control for the Safe lists (account selector dropdown + All accounts modal).
 * Reads/writes the shared, persisted orderByPreference so every Safe list stays in sync.
 */
const SafeListSortToggle = ({ options = BASIC_SORT_OPTIONS }: SafeListSortToggleProps) => {
  const dispatch = useAppDispatch()
  const { orderBy } = useAppSelector(selectOrderByPreference)
  // Fall back to the first option when the persisted order isn't offered here (e.g. balance in the modal).
  const active = options.find((option) => option.value === orderBy) ?? options[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            // Match the adjacent search InputGroup exactly: h-9, rounded-md, border-gray-100, shadow-none.
            // Fixed width so the trigger doesn't grow/shrink between options.
            size="default"
            className="h-9 w-[160px] shrink-0 justify-between gap-1.5 rounded-md border-gray-100 shadow-none text-muted-foreground"
            data-testid="safe-list-sort-toggle"
          />
        }
      >
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <ArrowDownUp className="size-4 shrink-0" />
          {active.label}
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={active.value}
            onValueChange={(next) => {
              const action = sortChangeAction(next, active.value)
              if (action) dispatch(action)
            }}
          >
            {options.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default SafeListSortToggle
