import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { Tooltip } from '@mui/material'
import { type AllSafeItems } from '@/hooks/safes'
import SafeCardReadOnly from './SafeCardReadOnly'
import { cn } from '@/utils/cn'

interface SortableSafeCardProps {
  id: string
  safe: AllSafeItems[number]
  isSimilar: boolean
}

const SortableSafeCard = ({ id, safe, isSimilar }: SortableSafeCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('group/sortable relative flex items-center', { 'z-10 opacity-80': isDragging })}
    >
      <Tooltip title="Drag to reorder" placement="left">
        <button
          type="button"
          aria-label="Drag to reorder account"
          className={cn(
            'absolute left-1 z-10 flex h-7 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover/sortable:opacity-100',
            { 'cursor-grabbing opacity-100': isDragging },
          )}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      </Tooltip>
      <SafeCardReadOnly safe={safe} isSimilar={isSimilar} className="flex-1 pl-7 sm:pl-9" />
    </div>
  )
}

export default SortableSafeCard
