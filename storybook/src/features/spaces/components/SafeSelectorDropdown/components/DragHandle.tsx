import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd'
import { GripVertical } from 'lucide-react'

/**
 * Grip shown at the left of a dropdown row while the list is in Manual sort — grab it to reorder.
 * Spreads the @hello-pangea/dnd drag-handle props onto its element. The click is stopped so tapping
 * the grip (without dragging) doesn't also fire the row's navigate-on-click.
 */
const DragHandle = ({ dragHandleProps }: { dragHandleProps?: DraggableProvidedDragHandleProps | null }) => (
  <span
    {...dragHandleProps}
    data-testid="safe-drag-handle"
    aria-label="Drag to reorder"
    onClick={(e) => e.stopPropagation()}
    className="-ml-1 flex shrink-0 cursor-grab items-center text-muted-foreground transition-colors hover:text-foreground active:cursor-grabbing"
  >
    <GripVertical className="size-4" />
  </span>
)

export default DragHandle
