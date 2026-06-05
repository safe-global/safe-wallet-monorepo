import { useMemo } from 'react'
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { type AllSafeItems, getSafeItemKey } from '@/hooks/safes'
import SafeCardsErrorBoundary from './SafeCardsErrorBoundary'
import SortableSafeCard from './SortableSafeCard'
import SimilarAddressAlert from '@/components/common/SimilarAddressAlert'

interface SortableAccountsListProps {
  safes: AllSafeItems
  similarAddresses: Set<string>
  onReorder: (orderedKeys: string[]) => void
}

const SortableAccountsList = ({ safes, similarAddresses, onReorder }: SortableAccountsListProps) => {
  const sensors = useSensors(
    // Require a small movement before dragging so clicks on the card still navigate
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const ids = useMemo(() => safes.map(getSafeItemKey), [safes])

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return
    onReorder(arrayMove(ids, oldIndex, newIndex))
  }

  return (
    <div className="flex w-full flex-col gap-2 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--border)] [&::-webkit-scrollbar-thumb:hover]:bg-[color-mix(in_srgb,var(--muted-foreground)_55%,var(--border))]">
      {similarAddresses.size > 0 && <SimilarAddressAlert />}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {safes.map((safe, index) => (
            <SafeCardsErrorBoundary key={ids[index]}>
              <SortableSafeCard
                id={ids[index]}
                safe={safe}
                isSimilar={similarAddresses.has(safe.address.toLowerCase())}
              />
            </SafeCardsErrorBoundary>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}

export default SortableAccountsList
