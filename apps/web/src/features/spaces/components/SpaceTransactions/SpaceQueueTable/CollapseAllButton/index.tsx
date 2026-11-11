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
  // Chevrons always; the outline and the word show on header hover. The wrapper undoes the header's capitals.
  <span className="normal-case [&>button]:border-transparent [&>button]:shadow-none group-hover/head:[&>button]:border-border group-hover/head:[&>button]:shadow-xs group-focus-within/head:[&>button]:border-border group-focus-within/head:[&>button]:shadow-xs">
    <Button size="xs" variant="outline" aria-label={allCollapsed ? 'Expand all' : 'Collapse all'} onClick={onToggle}>
      <span className="opacity-0 transition-opacity group-hover/head:opacity-100 group-focus-within/head:opacity-100">
        {allCollapsed ? 'Expand' : 'Collapse'} {count} {count === 1 ? 'Safe' : 'Safes'}
      </span>
      {allCollapsed ? <ChevronsUpDown /> : <ChevronsDownUp />}
    </Button>
  </span>
)

export default CollapseAllButton
