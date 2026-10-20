import type { ReactNode } from 'react'
import { ChevronDown, Info } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import { FilterOptionItems } from '@safe-global/views/components/common/Filters/FilterOptionItem'
import type { FilterDimension } from '@safe-global/views/components/common/Filters/filterState'

type FilterDropdownProps = {
  dimension: FilterDimension
  selected: string[]
  onToggle: (value: string) => void
  onClear: () => void
  /** Defaults to "Filter by <label>". */
  tooltip?: string
  footer?: ReactNode
}

export function FilterDropdown({ dimension, selected, onToggle, onClear, tooltip, footer }: FilterDropdownProps) {
  return (
    <DropdownMenu>
      <Tooltip delay={300}>
        <TooltipTrigger render={<DropdownMenuTrigger render={<Button variant="outline" />} />}>
          {dimension.label}
          <ChevronDown className="text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent>{tooltip ?? `Filter by ${dimension.label}`}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="start" className="w-60">
        <FilterOptionItems options={dimension.options} selected={selected} onToggle={onToggle} />
        {selected.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onClear}>
              <span className="flex-1">Clear</span>
              <span className="text-xs tabular-nums text-muted-foreground">{selected.length} selected</span>
            </DropdownMenuItem>
          </>
        )}
        {footer && (
          <>
            <DropdownMenuSeparator />
            {footer}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function FilterDropdownNote({ children, tooltip }: { children: ReactNode; tooltip?: ReactNode }) {
  const note = (
    <div className="flex cursor-default items-center gap-1.5 px-2 py-1.5 text-xs text-muted-foreground">
      <Info className="size-3.5 shrink-0" strokeWidth={ICON_STROKE} aria-hidden="true" />
      {children}
    </div>
  )
  if (!tooltip) return note
  return (
    <Tooltip delay={150}>
      <TooltipTrigger render={note} />
      <TooltipContent side="right" className="max-w-64 whitespace-normal">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}
