import { Fragment, useMemo, useRef, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { createPortal } from 'react-dom'
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { reorderByKey } from '@/utils/reorder'
import type { SafeAccountColumn } from './columns'
import type { AccountGroup, AccountLine } from './useSafeAccountRows'
import SafeAccountTableRow, { type RowCheckbox } from './SafeAccountTableRow'
import { SimilarityBandHeader } from './SimilarityBand'

type ReorderableBodyProps = {
  /** Top-level accounts in their current display order — each renders as one draggable row. */
  groups: AccountGroup[]
  columns: SafeAccountColumn[]
  flaggedAddresses?: Set<string>
  /** Lowercased address → cluster id; contiguous same-cluster rows render inside a warning band. */
  similarityGroups?: Map<string, string>
  /** Parent keys of the multi-chain groups whose per-chain children are currently shown. */
  expanded: Set<string>
  setExpanded: Dispatch<SetStateAction<Set<string>>>
  renderActions?: (line: AccountLine) => ReactNode
  onRename?: (line: AccountLine) => void
  onLinkClick?: (line: AccountLine) => void
  /** Selection mode: resolves a row's checkbox state — set only when the table is selectable. */
  getCheckbox?: (group: AccountGroup, line: AccountLine) => RowCheckbox
  /** Selection mode: fired when a row's checkbox (or the row itself) toggles. */
  onSelectToggle?: (line: AccountLine, nextChecked: boolean) => void
  /** Fired on drop with the reordered top-level account addresses, in display order. */
  onReorder: (orderedAddresses: string[]) => void
  /** Reports a row's lazily-fetched Safe overviews up to the table. */
  onOverviewsLoaded: (overviews: SafeOverview[]) => void
}

/** Toggles a group's expanded state, returning a new set (parent keys are stable across reorders). */
export const toggleExpanded = (set: Set<string>, key: string): Set<string> => {
  const next = new Set(set)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  return next
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
  similarityGroups,
  expanded,
  setExpanded,
  renderActions,
  onRename,
  onLinkClick,
  getCheckbox,
  onSelectToggle,
  onReorder,
  onOverviewsLoaded,
}: ReorderableBodyProps) => {
  // Remembers what was open across a drag: collapsing must happen before dnd measures the rows.
  const expandedBeforeDrag = useRef<Set<string>>(new Set())

  // Width of the floating drag clone's wrapper table — the sum of the fixed column widths, which the
  // cells keep pinned while dragging, so the lifted row stays column-aligned outside the main table.
  const draggedRowWidth = useMemo(
    () => columns.reduce((sum, column) => sum + parseInt(column.width ?? '0', 10), 0),
    [columns],
  )

  const handleBeforeCapture = () => {
    expandedBeforeDrag.current = expanded
    if (expanded.size > 0) setExpanded(new Set())
  }

  // Similarity clusters are pinned (non-draggable) at the top in Manual mode; only the rest reorder.
  const isClustered = (group: AccountGroup) => Boolean(similarityGroups?.get(group.parent.address.toLowerCase()))
  const pinnedGroups = groups.filter(isClustered)
  const draggableGroups = groups.filter((group) => !isClustered(group))

  const handleDragEnd = (result: DropResult) => {
    setExpanded(expandedBeforeDrag.current)
    const { source, destination } = result
    if (!destination || destination.index === source.index) return
    // Save the pinned cluster addresses first (they stay on top), then the reordered rest.
    const reordered = reorderByKey(draggableGroups, source.index, destination.index, (group) => group.parent.address)
    onReorder([...pinnedGroups.map((group) => group.parent.address), ...reordered])
  }

  return (
    <DragDropContext onBeforeCapture={handleBeforeCapture} onDragEnd={handleDragEnd}>
      <Droppable droppableId="safe-accounts-reorder">
        {(dropProvided) => (
          <TableBody ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
            {/* Pinned, non-draggable similarity bands at the top — each cluster reads as one block and
                can't be split or reordered; only the accounts below it are drag-and-droppable. */}
            {pinnedGroups.map((group, index) => {
              const { parent } = group
              const isExpanded = group.children.length > 0 && expanded.has(parent.key)
              const hasDivider = index < pinnedGroups.length - 1 || draggableGroups.length > 0
              const clusterId = similarityGroups?.get(parent.address.toLowerCase())
              const prevClusterId =
                index > 0 ? similarityGroups?.get(pinnedGroups[index - 1].parent.address.toLowerCase()) : undefined
              const bandHeader =
                clusterId && clusterId !== prevClusterId ? (
                  <SimilarityBandHeader key={`band-${clusterId}`} colSpan={columns.length} />
                ) : null

              return (
                <Fragment key={parent.key}>
                  {bandHeader}
                  <SafeAccountTableRow
                    line={parent}
                    columns={columns}
                    isFlagged={flaggedAddresses?.has(parent.address.toLowerCase())}
                    highlighted
                    expanded={parent.expandable ? isExpanded : undefined}
                    onToggle={
                      parent.expandable ? () => setExpanded((prev) => toggleExpanded(prev, parent.key)) : undefined
                    }
                    renderActions={renderActions}
                    onRename={onRename}
                    onLinkClick={onLinkClick}
                    checkbox={getCheckbox?.(group, parent)}
                    onSelectToggle={onSelectToggle ? (next) => onSelectToggle(parent, next) : undefined}
                    showDivider={hasDivider && !isExpanded}
                    onOverviewsLoaded={onOverviewsLoaded}
                  />
                  {isExpanded &&
                    group.children.map((child, childIndex) => (
                      <SafeAccountTableRow
                        key={child.key}
                        line={child}
                        columns={columns}
                        isFlagged={flaggedAddresses?.has(child.address.toLowerCase())}
                        highlighted
                        renderActions={renderActions}
                        onLinkClick={onLinkClick}
                        checkbox={getCheckbox?.(group, child)}
                        onSelectToggle={onSelectToggle ? (next) => onSelectToggle(child, next) : undefined}
                        showDivider={hasDivider && childIndex === group.children.length - 1}
                        onOverviewsLoaded={onOverviewsLoaded}
                      />
                    ))}
                </Fragment>
              )
            })}

            {draggableGroups.map((group, index) => {
              const { parent } = group
              const isExpanded = group.children.length > 0 && expanded.has(parent.key)
              const groupHasDivider = index < draggableGroups.length - 1

              return (
                <Fragment key={parent.key}>
                  <Draggable draggableId={parent.key} index={index}>
                    {(dragProvided, snapshot) => {
                      const row = (
                        <SafeAccountTableRow
                          line={parent}
                          columns={columns}
                          isFlagged={flaggedAddresses?.has(parent.address.toLowerCase())}
                          expanded={parent.expandable ? isExpanded : undefined}
                          onToggle={
                            parent.expandable
                              ? () => setExpanded((prev) => toggleExpanded(prev, parent.key))
                              : undefined
                          }
                          renderActions={renderActions}
                          onRename={onRename}
                          onLinkClick={onLinkClick}
                          checkbox={getCheckbox?.(group, parent)}
                          onSelectToggle={onSelectToggle ? (next) => onSelectToggle(parent, next) : undefined}
                          showDivider={groupHasDivider && !isExpanded}
                          rowRef={dragProvided.innerRef}
                          rowDraggableProps={dragProvided.draggableProps}
                          dragHandleProps={dragProvided.dragHandleProps}
                          isDragging={snapshot.isDragging}
                          onOverviewsLoaded={onOverviewsLoaded}
                        />
                      )

                      // While dragging, dnd pins the row to `position: fixed` in viewport coordinates.
                      // A transformed ancestor (e.g. the centered modal dialog's translate) would become
                      // its containing block and shove it sideways, so portal the lifted row to <body>,
                      // which never carries a transform. The wrapper table restores the table context the
                      // detached <tr> needs to render its cells at the pinned column widths.
                      return snapshot.isDragging
                        ? createPortal(
                            <Table
                              sx={{
                                width: draggedRowWidth,
                                borderCollapse: 'separate',
                                borderSpacing: 0,
                                margin: 0,
                              }}
                            >
                              <TableBody>{row}</TableBody>
                            </Table>,
                            document.body,
                          )
                        : row
                    }}
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
                        checkbox={getCheckbox?.(group, child)}
                        onSelectToggle={onSelectToggle ? (next) => onSelectToggle(child, next) : undefined}
                        showDivider={groupHasDivider && childIndex === group.children.length - 1}
                        onOverviewsLoaded={onOverviewsLoaded}
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
