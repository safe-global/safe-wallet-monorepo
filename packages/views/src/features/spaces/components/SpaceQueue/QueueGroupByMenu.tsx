import type { ReactElement } from 'react'
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
import type { QueueGroupBy } from './types'

const OPTIONS: Array<{ value: QueueGroupBy; label: string; hint: string }> = [
  { value: 'status', label: 'Status', hint: 'Transactions listed by order of urgency' },
  { value: 'next', label: 'Up next', hint: 'Next transaction on each Safe' },
  { value: 'safe', label: 'Safe', hint: 'Grouped by Safe, network and nonce order' },
  { value: 'network', label: 'Network', hint: 'Grouped by network' },
]

export const QueueGroupByMenu = ({
  value,
  onChange,
}: {
  value: QueueGroupBy
  onChange: (value: QueueGroupBy) => void
}): ReactElement => {
  const selected = OPTIONS.find((option) => option.value === value) ?? OPTIONS[0]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" aria-label={`Group by ${selected.label}`} />}>
        <Rows3 />
        Group by: {selected.label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Group by</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next as QueueGroupBy)}>
            {OPTIONS.map((option) => (
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
