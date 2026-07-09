import { Fragment, useRef, type Dispatch, type ReactNode, type SetStateAction } from 'react'
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
  /** Parent keys of the multi-chain groups whose per-chain children are currently shown. */
  expanded: Set<string>
  setExpanded: Dispatch<SetStateAction<Set<string>>>
  renderActions?: (line: AccountLine) => ReactNode
  onRename?: (line: AccountLine) => void
  onLinkClick?: (line: AccountLine) => void
  /** Fired on drop with the reordered top-level account addresses, in display order. */
  onReorder: (orderedAddresses: string[]) => void
}

/** Toggles a group's expanded state, returning a new set (parent keys are stable across reorders). */
export const toggleExpanded = (set: Set<string>, key: string): Set<string> => {
  const next = new Set(set)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  return next
}

/** Moves the account at `sourceIndex` to `destIndex` and returns the resulting address order. */
export const reorderAddresses = (groups: AccountGroup[], sourceIndex: number, destIndex: number): string[] => {
  const next = Array.from(groups)
  const [moved] = next.splice(sourceIndex, 1)
  next.splice(destIndex, 0, moved)
  return next.map((group) => group.parent.address)
}

/**
 * Renders the accounts table body as a vertical drag-and-drop list. Only the top-level account rows
 * are draggable (the grip lives on the parent); a multi-chain group can still be expanded to reveal
 * its per-chain children, which stay navigable while reordering is active. To keep the drag visuals
 * clean, the list collapses on drag start and re-expands the same groups on drop — since reordering
 * is group-based, the children always follow their parent to its new position.
 */
const ReorderableBody = ({
  groups,
  columns,
  flaggedAddresses,
  expanded,
  setExpanded,
  renderActions,
  onRename,
  onLinkClick,
  onReorder,
}: ReorderableBodyProps) => {
  // Remembers what was open across a drag: collapsing must happen before dnd measures the rows.
  const expandedBeforeDrag = useRef<Set<string>>(new Set())

  const handleBeforeCapture = () => {
    expandedBeforeDrag.current = expanded
    if (expanded.size > 0) setExpanded(new Set())
  }

  const handleDragEnd = (result: DropResult) => {
    setExpanded(expandedBeforeDrag.current)
    const { source, destination } = result
    if (!destination || destination.index === source.index) return
    onReorder(reorderAddresses(groups, source.index, destination.index))
  }

  return (
    <DragDropContext onBeforeCapture={handleBeforeCapture} onDragEnd={handleDragEnd}>
      <Droppable droppableId="safe-accounts-reorder">
        {(dropProvided) => (
          <TableBody ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
            {groups.map((group, index) => {
              const { parent } = group
              const isExpanded = group.children.length > 0 && expanded.has(parent.key)
              // Draw the group's separator under the last child when expanded, else under the parent.
              const groupHasDivider = index < groups.length - 1

              return (
                <Fragment key={parent.key}>
                  <Draggable draggableId={parent.key} index={index}>
                    {(dragProvided, snapshot) => (
                      <SafeAccountTableRow
                        line={parent}
                        columns={columns}
                        isFlagged={flaggedAddresses?.has(parent.address.toLowerCase())}
                        expanded={parent.expandable ? isExpanded : undefined}
                        onToggle={
                          parent.expandable ? () => setExpanded((prev) => toggleExpanded(prev, parent.key)) : undefined
                        }
                        renderActions={renderActions}
                        onRename={onRename}
                        onLinkClick={onLinkClick}
                        showDivider={groupHasDivider && !isExpanded}
                        rowRef={dragProvided.innerRef}
                        rowDraggableProps={dragProvided.draggableProps}
                        dragHandleProps={dragProvided.dragHandleProps}
                        isDragging={snapshot.isDragging}
                      />
                    )}
                  </Draggable>

                  {isExpanded &&
                    group.children.map((child, childIndex) => (
                      <SafeAccountTableRow
                        key={child.key}
                        line={child}
                        columns={columns}
                        isFlagged={flaggedAddresses?.has(child.address.toLowerCase())}
                        renderActions={renderActions}
                        onLinkClick={onLinkClick}
                        showDivider={groupHasDivider && childIndex === group.children.length - 1}
                      />
                    ))}
                </Fragment>
              )
            })}
            {dropProvided.placeholder}
          </TableBody>
        )}
      </Droppable>
    </DragDropContext>
  )
}

export default ReorderableBody
