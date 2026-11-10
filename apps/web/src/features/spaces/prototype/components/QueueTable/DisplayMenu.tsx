import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import {
  DEFAULT_DISPLAY,
  GROUP_OPTIONS,
  ORDER_OPTIONS,
  type GroupBy,
  type OrderBy,
  type QueueDisplay,
  type SortDirection,
} from '../../services/order'

const DIRECTION_LABELS: Record<OrderBy, Record<SortDirection, string>> = {
  status: { asc: 'Most urgent first', desc: 'Least urgent first' },
  proposed: { asc: 'Oldest first', desc: 'Newest first' },
  nonce: { asc: 'Lowest first', desc: 'Highest first' },
  value: { asc: 'Smallest first', desc: 'Largest first' },
  safe: { asc: 'A to Z', desc: 'Z to A' },
}

const isDefault = ({ order, groupBy }: QueueDisplay) =>
  order.by === DEFAULT_DISPLAY.order.by &&
  order.direction === DEFAULT_DISPLAY.order.direction &&
  groupBy === DEFAULT_DISPLAY.groupBy

// Option D: how the list is ordered and grouped. Column headers set the order too.
export function DisplayMenu({
  display,
  onChange,
}: {
  display: QueueDisplay
  onChange: (display: QueueDisplay) => void
}) {
  const { order, groupBy } = display
  const orderLabel = ORDER_OPTIONS.find((option) => option.value === order.by)!.label
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" aria-label={`Display: ${orderLabel}`} />}>
        <SlidersHorizontal />
        Display
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Order by</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={order.by}
            onValueChange={(value: OrderBy) =>
              onChange({
                ...display,
                order: { by: value, direction: ORDER_OPTIONS.find((option) => option.value === value)!.direction },
              })
            }
          >
            {ORDER_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Direction</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={order.direction}
            onValueChange={(value: SortDirection) => onChange({ ...display, order: { ...order, direction: value } })}
          >
            {(['asc', 'desc'] as const).map((direction) => (
              <DropdownMenuRadioItem key={direction} value={direction}>
                {DIRECTION_LABELS[order.by][direction]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Group by</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={groupBy}
            onValueChange={(value: GroupBy) => onChange({ ...display, groupBy: value })}
          >
            {GROUP_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        {!isDefault(display) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onChange(DEFAULT_DISPLAY)}>Reset to default</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
