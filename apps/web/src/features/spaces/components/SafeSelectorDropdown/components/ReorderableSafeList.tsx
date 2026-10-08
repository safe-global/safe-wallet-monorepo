import { createPortal } from 'react-dom'
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd'
import { clickOnEnterOrSpace } from '@/utils/keyboard'
import { reorderByKey } from '@/utils/reorder'
import DragHandle from '@views/features/spaces/components/SafeSelectorDropdown/components/DragHandle'
import {
  ReorderableGroupRowView,
  ReorderableSafeListView,
  ReorderableSingleRowView,
} from '@views/features/spaces/components/SafeSelectorDropdown/components/ReorderableSafeListView'
import SafeItem from './SafeItem'
import MultiChainSafeItemRow from './MultiChainSafeItemRow'
import type { SafeItemData, SafeRenameTarget } from '@views/features/spaces/components/SafeSelectorDropdown/types'

const DROPPABLE_ID = 'safe-selector-reorder'

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
      <Droppable droppableId={DROPPABLE_ID}>
        {(dropProvided) => (
          <ReorderableSafeListView
            innerRef={dropProvided.innerRef}
            droppableProps={dropProvided.droppableProps}
            placeholder={dropProvided.placeholder}
          >
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
                      <ReorderableGroupRowView
                        innerRef={dragProvided.innerRef}
                        draggableProps={dragProvided.draggableProps}
                        hidden={hidden}
                      >
                        <MultiChainSafeItemRow
                          item={item}
                          onRename={onRename}
                          isSelected={isCurrent}
                          leading={dragHandle}
                        />
                      </ReorderableGroupRowView>
                    ) : (
                      <ReorderableSingleRowView
                        innerRef={dragProvided.innerRef}
                        draggableProps={dragProvided.draggableProps}
                        hidden={hidden}
                        isCurrent={isCurrent}
                        onSelect={() => onSelect(item.id)}
                        onKeyDown={clickOnEnterOrSpace}
                        dragHandle={dragHandle}
                      >
                        <SafeItem {...item} onRename={onRename} />
                      </ReorderableSingleRowView>
                    )
                  // Escape the Select popup's positioning transform so the lifted row tracks the cursor.
                  return snapshot.isDragging ? createPortal(row, document.body) : row
                }}
              </Draggable>
            ))}
          </ReorderableSafeListView>
        )}
      </Droppable>
    </DragDropContext>
  )
}

export default ReorderableSafeList
