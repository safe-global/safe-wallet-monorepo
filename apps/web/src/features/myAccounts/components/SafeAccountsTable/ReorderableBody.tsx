import { useMemo, useRef, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import partition from 'lodash/partition'
import { createPortal } from 'react-dom'
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd'
import { TableBody } from '@/components/ui/table'
import tableCss from './styles.module.css'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { reorderByKey } from '@/utils/reorder'
import type { SafeAccountColumn } from './columns'
import type { AccountGroup, AccountLine } from './useSafeAccountRows'
import SafeAccountTableRow, { type RowCheckbox } from './SafeAccountTableRow'
import { bandHeaderAt } from './SimilarityBand'
import type { SimilarWarning } from '@/features/address-poisoning'

type ReorderableBodyProps = {
  /** Top-level accounts in their current display order — each renders as one draggable row. */
  groups: AccountGroup[]
  columns: SafeAccountColumn[]
  /** Lowercased address → cross-list look-alike peers; drives the inline ⚠️ + tooltip. */
  similarWarnings?: Map<string, SimilarWarning>
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
  /**
   * Fired on drop with ONLY the draggable (non-clustered) addresses — the parent weaves them into
   * the persisted order so pinned cluster rows (hoisted for display only) keep their stored slots.
   */
  onReorder: (orderedDraggableAddresses: string[]) => void
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

/** Row wiring shared by every group row (parent or child), so each call site doesn't re-thread it. */
type SharedRowProps = {
  columns: SafeAccountColumn[]
  similarWarnings?: Map<string, SimilarWarning>
  expanded: Set<string>
  setExpanded: Dispatch<SetStateAction<Set<string>>>
  renderActions?: (line: AccountLine) => ReactNode
  onRename?: (line: AccountLine) => void
  onLinkClick?: (line: AccountLine) => void
  getCheckbox?: (group: AccountGroup, line: AccountLine) => RowCheckbox
  onSelectToggle?: (line: AccountLine, nextChecked: boolean) => void
  onOverviewsLoaded: (overviews: SafeOverview[]) => void
}

/** The per-chain child rows of an expanded group — identical in both bodies bar the band tint. */
const GroupChildRows = ({
  group,
  shared,
  highlighted,
  lastChildDivider,
}: {
  group: AccountGroup
  shared: SharedRowProps
  highlighted?: boolean
  /** Whether the group itself draws a bottom divider — only its last child carries it. */
  lastChildDivider: boolean
}) => {
  const { columns, similarWarnings, renderActions, onLinkClick, getCheckbox, onSelectToggle, onOverviewsLoaded } =
    shared
  return (
    <>
      {group.children.map((child, index) => (
        <SafeAccountTableRow
          key={child.key}
          line={child}
          columns={columns}
          warning={similarWarnings?.get(child.address.toLowerCase())}
          highlighted={highlighted}
          renderActions={renderActions}
          onLinkClick={onLinkClick}
          checkbox={getCheckbox?.(group, child)}
          onSelectToggle={onSelectToggle ? (next) => onSelectToggle(child, next) : undefined}
          showDivider={lastChildDivider && index === group.children.length - 1}
          onOverviewsLoaded={onOverviewsLoaded}
        />
      ))}
    </>
  )
}

/** One pinned (non-draggable) cluster group: its band header, highlighted parent, and children. */
const PinnedGroupRows = ({
  group,
  index,
  pinnedGroups,
  hasDraggable,
  similarityGroups,
  shared,
}: {
  group: AccountGroup
  index: number
  pinnedGroups: AccountGroup[]
  hasDraggable: boolean
  similarityGroups?: Map<string, string>
  shared: SharedRowProps
}) => {
  const { parent } = group
  const {
    columns,
    similarWarnings,
    expanded,
    setExpanded,
    renderActions,
    onRename,
    onLinkClick,
    getCheckbox,
    onSelectToggle,
    onOverviewsLoaded,
  } = shared
  const isExpanded = group.children.length > 0 && expanded.has(parent.key)
  const hasDivider = index < pinnedGroups.length - 1 || hasDraggable
  const bandHeader = bandHeaderAt(
    index,
    (i) => similarityGroups?.get(pinnedGroups[i].parent.address.toLowerCase()),
    columns.length,
  )

  return (
    <>
      {bandHeader}
      <SafeAccountTableRow
        line={parent}
        columns={columns}
        warning={similarWarnings?.get(parent.address.toLowerCase())}
        highlighted
        expanded={parent.expandable ? isExpanded : undefined}
        onToggle={parent.expandable ? () => setExpanded((prev) => toggleExpanded(prev, parent.key)) : undefined}
        renderActions={renderActions}
        onRename={onRename}
        onLinkClick={onLinkClick}
        checkbox={getCheckbox?.(group, parent)}
        onSelectToggle={onSelectToggle ? (next) => onSelectToggle(parent, next) : undefined}
        showDivider={hasDivider && !isExpanded}
        onOverviewsLoaded={onOverviewsLoaded}
      />
      {isExpanded && <GroupChildRows group={group} shared={shared} highlighted lastChildDivider={hasDivider} />}
    </>
  )
}

/** One draggable group: parent wrapped in a Draggable (portaled to <body> while dragging), then children. */
const DraggableGroupRows = ({
  group,
  index,
  count,
  draggedRowWidth,
  shared,
}: {
  group: AccountGroup
  index: number
  count: number
  draggedRowWidth: number
  shared: SharedRowProps
}) => {
  const { parent } = group
  const {
    columns,
    similarWarnings,
    expanded,
    setExpanded,
    renderActions,
    onRename,
    onLinkClick,
    getCheckbox,
    onSelectToggle,
    onOverviewsLoaded,
  } = shared
  const isExpanded = group.children.length > 0 && expanded.has(parent.key)
  const groupHasDivider = index < count - 1

  return (
    <>
      <Draggable draggableId={parent.key} index={index}>
        {(dragProvided, snapshot) => {
          const row = (
            <SafeAccountTableRow
              line={parent}
              columns={columns}
              warning={similarWarnings?.get(parent.address.toLowerCase())}
              expanded={parent.expandable ? isExpanded : undefined}
              onToggle={parent.expandable ? () => setExpanded((prev) => toggleExpanded(prev, parent.key)) : undefined}
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

          // dnd pins the dragged row with `position: fixed`; a transformed ancestor (the centered modal)
          // would become its containing block and shove it sideways, so portal it to <body>. The wrapper
          // table keeps the detached <tr> renderable.
          return snapshot.isDragging
            ? createPortal(
                <table
                  className={`caption-bottom text-sm ${tableCss.table}`}
                  style={{ width: draggedRowWidth, borderCollapse: 'separate', borderSpacing: 0, margin: 0 }}
                >
                  <TableBody>{row}</TableBody>
                </table>,
                document.body,
              )
            : row
        }}
      </Draggable>
      {isExpanded && <GroupChildRows group={group} shared={shared} lastChildDivider={groupHasDivider} />}
    </>
  )
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
  similarWarnings,
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
  const [pinnedGroups, draggableGroups] = partition(groups, isClustered)

  const handleDragEnd = (result: DropResult) => {
    setExpanded(expandedBeforeDrag.current)
    const { source, destination } = result
    if (!destination || destination.index === source.index) return
    // Report only the draggable rows' new order; the parent decides how it lands in the stored order.
    onReorder(reorderByKey(draggableGroups, source.index, destination.index, (group) => group.parent.address))
  }

  const shared: SharedRowProps = {
    columns,
    similarWarnings,
    expanded,
    setExpanded,
    renderActions,
    onRename,
    onLinkClick,
    getCheckbox,
    onSelectToggle,
    onOverviewsLoaded,
  }

  return (
    <DragDropContext onBeforeCapture={handleBeforeCapture} onDragEnd={handleDragEnd}>
      <Droppable droppableId="safe-accounts-reorder">
        {(dropProvided) => (
          <TableBody ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
            {/* Similarity bands are pinned on top and can't be split; only the rows below drag. */}
            {pinnedGroups.map((group, index) => (
              <PinnedGroupRows
                key={group.parent.key}
                group={group}
                index={index}
                pinnedGroups={pinnedGroups}
                hasDraggable={draggableGroups.length > 0}
                similarityGroups={similarityGroups}
                shared={shared}
              />
            ))}

            {draggableGroups.map((group, index) => (
              <DraggableGroupRows
                key={group.parent.key}
                group={group}
                index={index}
                count={draggableGroups.length}
                draggedRowWidth={draggedRowWidth}
                shared={shared}
              />
            ))}
            {dropProvided.placeholder}
          </TableBody>
        )}
      </Droppable>
    </DragDropContext>
  )
}

export default ReorderableBody
