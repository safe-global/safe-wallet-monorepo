import type { ReactElement } from 'react'
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'

const CollapseAllButton = ({
  allCollapsed,
  count,
  onToggle,
}: {
  allCollapsed: boolean
  count: number
  onToggle: () => void
}): ReactElement => (
  // The header sets its labels in capitals; the button's label is a sentence
  <span className="normal-case">
    <Button size="xs" variant="ghost" aria-label={allCollapsed ? 'Expand all' : 'Collapse all'} onClick={onToggle}>
      <span className="opacity-0 transition-opacity group-hover/head:opacity-100 group-focus-within/head:opacity-100">
        {allCollapsed ? 'Expand' : 'Collapse'} {count} {count === 1 ? 'Safe' : 'Safes'}
      </span>
      {allCollapsed ? <ChevronsUpDown /> : <ChevronsDownUp />}
    </Button>
  </span>
)

export default CollapseAllButton
