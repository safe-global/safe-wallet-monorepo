import { createPortal } from 'react-dom'
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd'
import { cn } from '@/utils/cn'
import { clickOnEnterOrSpace } from '@/utils/keyboard'
import { reorderByKey } from '@/utils/reorder'
import DragHandle from './DragHandle'
import SafeItem from './SafeItem'
import MultiChainSafeItemRow from './MultiChainSafeItemRow'
import type { SafeItemData, SafeRenameTarget } from '../types'

interface ReorderableSafeListProps {
  items: SafeItemData[]
  selectedItemId?: string
  /** Navigates to the safe (and closes the dropdown). */
  onSelect: (itemId: string) => void
  onRename?: (target: SafeRenameTarget) => void
  /** Fired on drop with the reordered top-level addresses, in display order. */
  onReorder: (orderedAddresses: string[]) => void
  /** Disables dragging and hides the grips — set while searching, where a drop would persist a partial order. */
  isDragDisabled?: boolean
  /** Search non-matches: hidden rather than unmounted (see SafeDropdownContainer). */
  hiddenIds?: ReadonlySet<string>
}

/**
 * Drag-and-drop variant of the safe list, shown while the dropdown is in Manual sort. Every top-level
 * account is one draggable row with a leading grip; the drop order is persisted as the manual sort.
 * Single-chain rows reuse <SafeItem /> and navigate on click. Multi-chain rows reuse the same
 * <MultiChainSafeItemRow /> as the non-Manual list — clicking the summary expands the group (rather
 * than jumping to one network) and the grip drags the whole group; the per-chain rows navigate.
 *
 * Auto-scroll works within the dropdown's scroll container, so lists longer than the fold reorder too.
 * The dragged row is portaled to <body> so the Select popup's positioning transform can't offset it.
 */
const ReorderableSafeList = ({
  items,
  selectedItemId,
  onSelect,
  onRename,
  onReorder,
  isDragDisabled = false,
  hiddenIds,
}: ReorderableSafeListProps) => {
  const handleDragEnd = ({ source, destination }: DropResult) => {
    if (!destination || destination.index === source.index) return
    onReorder(reorderByKey(items, source.index, destination.index, (item) => item.address))
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="safe-selector-reorder">
        {(dropProvided) => (
          <div ref={dropProvided.innerRef} {...dropProvided.droppableProps} data-testid="safe-selector-reorder-list">
            {items.map((item, index) => (
              <Draggable key={item.address} draggableId={item.address} index={index} isDragDisabled={isDragDisabled}>
                {(dragProvided, snapshot) => {
                  const isCurrent = item.id === selectedItemId
                  const hidden = hiddenIds?.has(item.id)
                  // No grip while dragging is disabled (search) — dnd allows a missing handle only when
                  // the draggable is disabled, and an inert grip would wrongly signal "draggable".
                  const dragHandle = isDragDisabled ? null : (
                    <DragHandle dragHandleProps={dragProvided.dragHandleProps} />
                  )
                  // Multi-chain groups keep their expand/collapse behaviour (grip lives in the summary row);
                  // single-chain rows stay a flat, click-to-navigate row.
                  const row =
                    item.chains.length > 1 ? (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        hidden={hidden}
                        data-testid="reorder-safe-row"
                        className="my-0.5"
                      >
                        <MultiChainSafeItemRow
                          item={item}
                          onRename={onRename}
                          isSelected={isCurrent}
                          leading={dragHandle}
                        />
                      </div>
                    ) : (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        hidden={hidden}
                        className="my-0.5"
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          data-current-safe={isCurrent ? 'true' : undefined}
                          data-testid="reorder-safe-row"
                          onClick={() => onSelect(item.id)}
                          onKeyDown={clickOnEnterOrSpace}
                          className={cn(
                            'group/row flex cursor-pointer items-center gap-2 rounded-lg py-3 pl-2 pr-3',
                            // The current safe hovers to a deeper green instead of the grey used by the rest.
                            isCurrent
                              ? 'bg-[var(--color-background-light)] hover:bg-[var(--color-background-light-hover)]'
                              : 'hover:bg-muted',
                          )}
                        >
                          {dragHandle}
                          {/* Mirror SelectItem's `[&>div]:min-w-0 [&>div]:shrink`: without it SafeItem's
                              w-full overflows past the grip and clips the trailing balance column. */}
                          <div className="min-w-0 flex-1">
                            <SafeItem {...item} onRename={onRename} />
                          </div>
                        </div>
                      </div>
                    )
                  // Escape the Select popup's positioning transform so the lifted row tracks the cursor.
                  return snapshot.isDragging ? createPortal(row, document.body) : row
                }}
              </Draggable>
            ))}
            {dropProvided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}

export default ReorderableSafeList
