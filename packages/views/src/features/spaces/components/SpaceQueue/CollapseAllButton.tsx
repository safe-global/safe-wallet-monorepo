import type { ReactElement } from 'react'
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'

/** Shows only its chevrons until the header row, a `group/head`, is hovered or focused. */
const CollapseAllButton = ({
  allCollapsed,
  count,
  onToggle,
}: {
  allCollapsed: boolean
  count: number
  onToggle: () => void
}): ReactElement => (
  <Button
    size="xs"
    variant="ghost-muted"
    className="normal-case"
    aria-label={allCollapsed ? 'Expand all' : 'Collapse all'}
    onClick={onToggle}
  >
    <span className="opacity-0 transition-opacity group-hover/head:opacity-100 group-focus-within/head:opacity-100">
      {allCollapsed ? 'Expand' : 'Collapse'} {count} {count === 1 ? 'Safe' : 'Safes'}
    </span>
    {allCollapsed ? <ChevronsUpDown /> : <ChevronsDownUp />}
  </Button>
)

export default CollapseAllButton
