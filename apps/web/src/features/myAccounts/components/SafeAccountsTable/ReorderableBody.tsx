import type { ReactNode } from 'react'
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd'
import TableBody from '@mui/material/TableBody'
import type { SafeAccountColumn } from './columns'
import type { AccountGroup, AccountLine } from './useSafeAccountRows'
import SafeAccountTableRow from './SafeAccountTableRow'

type ReorderableBodyProps = {
  /** Top-level accounts in their current display order — each renders as one draggable row. */
  groups: AccountGroup[]
  columns: SafeAccountColumn[]
  flaggedAddresses?: Set<string>
  renderActions?: (line: AccountLine) => ReactNode
  onRename?: (line: AccountLine) => void
  onLinkClick?: () => void
  /** Fired on drop with the reordered top-level account addresses, in display order. */
  onReorder: (orderedAddresses: string[]) => void
}

/** Moves the account at `sourceIndex` to `destIndex` and returns the resulting address order. */
export const reorderAddresses = (groups: AccountGroup[], sourceIndex: number, destIndex: number): string[] => {
  const next = Array.from(groups)
  const [moved] = next.splice(sourceIndex, 1)
  next.splice(destIndex, 0, moved)
  return next.map((group) => group.parent.address)
}

/**
 * Renders the accounts table body as a vertical drag-and-drop list (multi-chain groups are
 * collapsed to their parent row, so every row is a top-level account). On drop it emits the new
 * order of account addresses; persisting and re-sorting is the caller's responsibility.
 */
const ReorderableBody = ({
  groups,
  columns,
  flaggedAddresses,
  renderActions,
  onRename,
  onLinkClick,
  onReorder,
}: ReorderableBodyProps) => {
  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result
    if (!destination || destination.index === source.index) return
    onReorder(reorderAddresses(groups, source.index, destination.index))
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="safe-accounts-reorder">
        {(dropProvided) => (
          <TableBody ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
            {groups.map((group, index) => (
              <Draggable key={group.parent.key} draggableId={group.parent.key} index={index}>
                {(dragProvided, snapshot) => (
                  <SafeAccountTableRow
                    line={group.parent}
                    columns={columns}
                    isFlagged={flaggedAddresses?.has(group.parent.address.toLowerCase())}
                    renderActions={renderActions}
                    onRename={onRename}
                    onLinkClick={onLinkClick}
                    showDivider={index < groups.length - 1}
                    rowRef={dragProvided.innerRef}
                    rowDraggableProps={dragProvided.draggableProps}
                    dragHandleProps={dragProvided.dragHandleProps}
                    isDragging={snapshot.isDragging}
                  />
                )}
              </Draggable>
            ))}
            {dropProvided.placeholder}
          </TableBody>
        )}
      </Droppable>
    </DragDropContext>
  )
}

export default ReorderableBody
