import type { ReactElement } from 'react'
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'

export type CollapseAllButtonProps = {
  allCollapsed: boolean
  count: number
  /** What is collapsed, singular and plural */
  unit?: [string, string]
  onToggle: () => void
}

/** Shows only its chevrons until the header row, a `group/head`, is hovered or focused. */
const CollapseAllButton = ({
  allCollapsed,
  count,
  unit = ['Safe', 'Safes'],
  onToggle,
}: CollapseAllButtonProps): ReactElement => (
  <Button
    size="xs"
    variant="ghost-muted"
    className="normal-case"
    aria-label={allCollapsed ? 'Expand all' : 'Collapse all'}
    onClick={onToggle}
  >
    <span className="opacity-0 transition-opacity group-hover/head:opacity-100 group-focus-within/head:opacity-100">
      {allCollapsed ? 'Expand' : 'Collapse'} {count} {count === 1 ? unit[0] : unit[1]}
    </span>
    {allCollapsed ? <ChevronsUpDown /> : <ChevronsDownUp />}
  </Button>
)

export default CollapseAllButton
