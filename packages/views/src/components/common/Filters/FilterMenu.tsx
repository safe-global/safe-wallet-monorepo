import { ListFilter } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import { FilterOptionItems } from '@safe-global/views/components/common/Filters/FilterOptionItem'
import {
  getAppliedFilters,
  type FilterDimension,
  type FilterSelection,
} from '@safe-global/views/components/common/Filters/filterState'

type FilterMenuProps = {
  dimensions: FilterDimension[]
  selection: FilterSelection
  onToggle: (id: string, value: string) => void
  onReset: () => void
}

export function FilterMenu({ dimensions, selection, onToggle, onReset }: FilterMenuProps) {
  const appliedCount = getAppliedFilters(dimensions, selection).length

  return (
    <DropdownMenu>
      <Tooltip delay={300}>
        <TooltipTrigger render={<DropdownMenuTrigger render={<Button variant="outline" />} />}>
          <ListFilter />
          Filter
        </TooltipTrigger>
        <TooltipContent>All filters</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-60">
        {dimensions.map((dimension) => {
          const selected = selection[dimension.id] ?? []
          return (
            <DropdownMenuSub key={dimension.id}>
              <DropdownMenuSubTrigger>
                <span className="flex flex-1 items-center gap-2 pr-2">
                  {dimension.label}
                  {selected.length > 0 && (
                    <>
                      <span aria-hidden="true" className="size-1.5 rounded-full bg-success-strong" />
                      <Badge variant="secondary" className="ml-auto font-normal">
                        {selected.length}
                      </Badge>
                    </>
                  )}
                </span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-60">
                <FilterOptionItems
                  options={dimension.options}
                  selected={selected}
                  onToggle={(value) => onToggle(dimension.id, value)}
                />
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )
        })}
        {appliedCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onReset}>
              <span className="flex-1">Reset all filters</span>
              <span className="text-xs tabular-nums text-muted-foreground">{appliedCount} applied</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
