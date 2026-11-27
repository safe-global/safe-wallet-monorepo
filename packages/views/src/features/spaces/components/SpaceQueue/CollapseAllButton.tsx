import type { ReactElement } from 'react'
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'

export type CollapseAllButtonProps = {
  allCollapsed: boolean
  count: number
  /** What is collapsed, singular and plural */
  unit?: [string, string]
  onToggle: () => void
  /** Only the chevrons: the label, though hidden until hover, would push them out of a narrow header */
  iconOnly?: boolean
}

/** Shows only its chevrons until the header row, a `group/head`, is hovered or focused. */
const CollapseAllButton = ({
  allCollapsed,
  count,
  unit = ['Safe', 'Safes'],
  onToggle,
  iconOnly = false,
}: CollapseAllButtonProps): ReactElement => (
  <Button
    size={iconOnly ? 'icon-xs' : 'xs'}
    variant="ghost-muted"
    className="normal-case"
    aria-label={allCollapsed ? 'Expand all' : 'Collapse all'}
    onClick={onToggle}
  >
    {!iconOnly && (
      <span className="opacity-0 transition-opacity group-hover/head:opacity-100 group-focus-within/head:opacity-100">
        {allCollapsed ? 'Expand' : 'Collapse'} {count} {count === 1 ? unit[0] : unit[1]}
      </span>
    )}
    {allCollapsed ? <ChevronsUpDown /> : <ChevronsDownUp />}
  </Button>
)

export default CollapseAllButton
