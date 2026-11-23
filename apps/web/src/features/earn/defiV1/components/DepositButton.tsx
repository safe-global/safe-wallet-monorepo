import { ChevronDown } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import { DEFI_V1_COPY, formatApy } from '../copy'
import type { Opportunity } from '../types'

/** M1 toolbar action: pick an opportunity, then deposit from its side panel. */
export const DepositButton = ({ options, onPick }: { options: Opportunity[]; onPick: (item: Opportunity) => void }) => (
  <DropdownMenu>
    <DropdownMenuTrigger render={<Button size="action" data-testid="deposit-button" />}>
      {DEFI_V1_COPY.action.deposit}
      <ChevronDown />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-72">
      <DropdownMenuGroup>
        <DropdownMenuLabel>{DEFI_V1_COPY.m1.depositInto}</DropdownMenuLabel>
        {options.map((item) => (
          <DropdownMenuItem key={item.id} onClick={() => onPick(item)}>
            <span className="min-w-0 flex-1 truncate">{item.name}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatApy(item.apy)} · {item.exitShort}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
)
