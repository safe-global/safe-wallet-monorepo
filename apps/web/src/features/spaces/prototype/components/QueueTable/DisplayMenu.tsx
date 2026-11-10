import { Rows3 } from 'lucide-react'
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
import { GROUP_OPTIONS, type GroupBy, type QueueDisplay } from '../../services/order'

// Option D: how rows are grouped. Each grouping has its own fixed order.
export function DisplayMenu({
  display,
  onChange,
}: {
  display: QueueDisplay
  onChange: (display: QueueDisplay) => void
}) {
  const group = GROUP_OPTIONS.find((option) => option.value === display.groupBy)!
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" aria-label={`Group by ${group.label}`} />}>
        <Rows3 />
        Group by: {group.label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Group by</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={display.groupBy}
            onValueChange={(value: GroupBy) => onChange({ groupBy: value })}
          >
            {GROUP_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                <span className="flex flex-col">
                  {option.label}
                  <span className="text-xs text-muted-foreground">{option.hint}</span>
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
