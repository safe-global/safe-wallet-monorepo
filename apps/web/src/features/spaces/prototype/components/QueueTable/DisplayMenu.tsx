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
import { DISPLAY_CHOICES, STATUS_CHOICE, type GroupBy, type QueueDisplay } from '../../services/order'

// Status, the default, is one list in status order. The other choices group it, each in its own fixed order.
export function DisplayMenu({
  display,
  onChange,
}: {
  display: QueueDisplay
  onChange: (display: QueueDisplay) => void
}) {
  const group = DISPLAY_CHOICES.find((option) => option.value === display.groupBy) ?? STATUS_CHOICE
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
            {DISPLAY_CHOICES.map((option) => (
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
