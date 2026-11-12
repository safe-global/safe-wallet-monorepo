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
import { GROUP_OPTIONS, NO_GROUP, type GroupBy, type QueueDisplay } from '../../services/order'

// Option D: a flat list by default, or grouped. Each grouping has its own fixed order.
const CHOICES = [NO_GROUP, ...GROUP_OPTIONS]
export function DisplayMenu({
  display,
  onChange,
}: {
  display: QueueDisplay
  onChange: (display: QueueDisplay) => void
}) {
  const group = CHOICES.find((option) => option.value === display.groupBy) ?? NO_GROUP
  const grouped = group.value !== 'none'
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" aria-label={grouped ? `Group by ${group.label}` : 'Group by'} />}
      >
        <Rows3 />
        {grouped ? `Group by: ${group.label}` : 'Group by'}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Group by</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={display.groupBy}
            onValueChange={(value: GroupBy) => onChange({ groupBy: value })}
          >
            {CHOICES.map((option) => (
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
