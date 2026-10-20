import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { DropdownMenuCheckboxItem } from '@safe-global/views/components/ui/dropdown-menu'
import type { FilterOption } from '@safe-global/views/components/common/Filters/filterState'

type FilterOptionItemProps = {
  label: string
  icon?: ReactNode
  count?: number
  checked: boolean
  onCheckedChange: () => void
}

export function FilterOptionItem({ label, icon, count, checked, onCheckedChange }: FilterOptionItemProps) {
  return (
    <DropdownMenuCheckboxItem
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="group/option pr-2 [&>[data-slot=dropdown-menu-checkbox-item-indicator]]:hidden"
    >
      <span
        aria-hidden="true"
        className="flex size-4 shrink-0 items-center justify-center rounded border border-border opacity-0 group-data-[highlighted]/option:opacity-100 group-data-[checked]/option:border-primary group-data-[checked]/option:bg-primary group-data-[checked]/option:opacity-100"
      >
        {/* The menu item recolours every child on focus; the check must stay white on the filled box. */}
        {checked && <Check className="size-3 text-primary-foreground!" />}
      </span>
      {icon && (
        <span aria-hidden="true" className="flex size-4 shrink-0 items-center justify-center">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined && <span className="text-xs tabular-nums text-muted-foreground">{count}</span>}
    </DropdownMenuCheckboxItem>
  )
}

export function FilterOptionItems({
  options,
  selected,
  onToggle,
}: {
  options: FilterOption[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return options.map((option) => (
    <FilterOptionItem
      key={option.value}
      label={option.label}
      icon={option.icon}
      count={option.count}
      checked={selected.includes(option.value)}
      onCheckedChange={() => onToggle(option.value)}
    />
  ))
}
