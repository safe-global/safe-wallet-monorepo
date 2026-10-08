import type { KeyboardEvent, ReactNode } from 'react'
import type { DraggableProvided, DroppableProvided } from '@hello-pangea/dnd'
import { cn } from '@/utils/cn'

export interface ReorderableSafeListViewProps {
  innerRef: DroppableProvided['innerRef']
  droppableProps: DroppableProvided['droppableProps']
  placeholder: ReactNode
  children: ReactNode
}

export const ReorderableSafeListView = ({
  innerRef,
  droppableProps,
  placeholder,
  children,
}: ReorderableSafeListViewProps) => (
  <div ref={innerRef} {...droppableProps} data-testid="safe-selector-reorder-list">
    {children}
    {placeholder}
  </div>
)

export interface ReorderableGroupRowViewProps {
  innerRef: DraggableProvided['innerRef']
  draggableProps: DraggableProvided['draggableProps']
  hidden?: boolean
  children: ReactNode
}

export const ReorderableGroupRowView = ({
  innerRef,
  draggableProps,
  hidden,
  children,
}: ReorderableGroupRowViewProps) => (
  <div ref={innerRef} {...draggableProps} hidden={hidden} data-testid="reorder-safe-row" className="my-0.5">
    {children}
  </div>
)

export interface ReorderableSingleRowViewProps {
  innerRef: DraggableProvided['innerRef']
  draggableProps: DraggableProvided['draggableProps']
  hidden?: boolean
  isCurrent: boolean
  onSelect: () => void
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void
  dragHandle: ReactNode
  children: ReactNode
}

export const ReorderableSingleRowView = ({
  innerRef,
  draggableProps,
  hidden,
  isCurrent,
  onSelect,
  onKeyDown,
  dragHandle,
  children,
}: ReorderableSingleRowViewProps) => (
  <div ref={innerRef} {...draggableProps} hidden={hidden} className="my-0.5">
    <div
      role="button"
      tabIndex={0}
      data-current-safe={isCurrent ? 'true' : undefined}
      data-testid="reorder-safe-row"
      onClick={onSelect}
      onKeyDown={onKeyDown}
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
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  </div>
)
