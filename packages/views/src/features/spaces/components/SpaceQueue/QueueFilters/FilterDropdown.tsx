import type { ReactElement, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@safe-global/views/components/ui/dropdown-menu'

type FilterDropdownProps = {
  label: string
  contentClassName: string
  children: ReactNode
}

const FilterDropdown = ({ label, contentClassName, children }: FilterDropdownProps): ReactElement => (
  <DropdownMenu>
    <DropdownMenuTrigger render={<Button variant="outline" />}>
      {label}
      <ChevronDown />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className={contentClassName}>
      {children}
    </DropdownMenuContent>
  </DropdownMenu>
)

export default FilterDropdown
