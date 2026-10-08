import type { ReactNode } from 'react'
import type { DroppableProvided } from '@hello-pangea/dnd'
import { TableBody, tableVariants } from '@/components/ui/table'
import tableCss from './styles.module.css'

export type ReorderableBodyViewProps = {
  bodyRef: DroppableProvided['innerRef']
  droppableProps: DroppableProvided['droppableProps']
  pinnedRows: ReactNode
  draggableRows: ReactNode
  placeholder: ReactNode
}

export const ReorderableBodyView = ({
  bodyRef,
  droppableProps,
  pinnedRows,
  draggableRows,
  placeholder,
}: ReorderableBodyViewProps) => {
  return (
    <TableBody ref={bodyRef} {...droppableProps}>
      {/* Similarity bands are pinned on top and can't be split; only the rows below drag. */}
      {pinnedRows}

      {draggableRows}
      {placeholder}
    </TableBody>
  )
}

export type DraggedRowTableViewProps = {
  width: number
  children: ReactNode
}

/** Wrapper table that keeps a detached, portaled <tr> renderable while it is being dragged. */
export const DraggedRowTableView = ({ width, children }: DraggedRowTableViewProps) => {
  return (
    <table className={`${tableVariants({ variant: 'panel' })} ${tableCss.accounts}`} style={{ width, margin: 0 }}>
      <TableBody>{children}</TableBody>
    </table>
  )
}
