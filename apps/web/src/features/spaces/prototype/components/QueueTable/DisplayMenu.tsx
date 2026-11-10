import { ArrowUpDown, Rows3 } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import {
  DEFAULT_SORT,
  GROUP_OPTIONS,
  SORT_OPTIONS,
  type GroupBy,
  type QueueDisplay,
  type SortBy,
} from '../../services/order'

// Option D: Group by and Sort, side by side. Column headers sort too.
export function DisplayMenu({
  display,
  onChange,
}: {
  display: QueueDisplay
  onChange: (display: QueueDisplay) => void
}) {
  const group = GROUP_OPTIONS.find((option) => option.value === display.groupBy)!
  const sort = SORT_OPTIONS.find((option) => option.value === display.sort)!
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" aria-label={`Group by ${group.label}`} />}>
          <Rows3 />
          Group by: {group.label}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Group by</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={display.groupBy}
              // Each grouping starts from its own default sort.
              onValueChange={(value: GroupBy) => onChange({ groupBy: value, sort: DEFAULT_SORT[value] })}
            >
              {GROUP_OPTIONS.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  <span className="flex flex-col">
                    {option.label}
                    {option.hint && <span className="text-xs text-muted-foreground">{option.hint}</span>}
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" aria-label={`Sort: ${sort.label}`} />}>
          <ArrowUpDown />
          Sort: {sort.label}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Sort</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={display.sort}
              onValueChange={(value: SortBy) => onChange({ ...display, sort: value })}
            >
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
