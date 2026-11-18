import type { ReactElement, ReactNode } from 'react'
import { DropdownMenuCheckboxItem } from '@safe-global/views/components/ui/dropdown-menu'

type FilterOptionItemProps = {
  icon?: ReactNode
  label: ReactNode
  /** Hidden when absent */
  count?: number
  checked: boolean
  onToggle: () => void
}

const FilterOptionItem = ({ icon, label, count, checked, onToggle }: FilterOptionItemProps): ReactElement => (
  <DropdownMenuCheckboxItem checked={checked} onCheckedChange={onToggle}>
    {icon}
    <span className="truncate">{label}</span>
    {count !== undefined && <span className="ml-auto pl-6 tabular-nums text-muted-foreground">{count}</span>}
  </DropdownMenuCheckboxItem>
)

export const NoFilterOptions = ({ children }: { children: ReactNode }): ReactElement => (
  <p className="px-2 py-1.5 text-sm text-muted-foreground">{children}</p>
)

export default FilterOptionItem
