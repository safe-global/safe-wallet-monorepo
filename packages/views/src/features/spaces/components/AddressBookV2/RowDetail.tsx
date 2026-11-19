import { Fragment } from 'react'
import type { DataTableColumn } from '@safe-global/views/components/common/PaginatedDataTable'

/** The compact table's expanded row: each secondary column as a label beside its cell. */
const RowDetail = <T,>({ row, columns }: { row: T; columns: DataTableColumn<T>[] }) => (
  <dl className="grid grid-cols-[5rem_1fr] items-center gap-x-2 gap-y-2 text-sm">
    {columns.map((column) => (
      <Fragment key={column.id}>
        <dt className="text-muted-foreground">{column.header}</dt>
        <dd>{column.cell(row, { isCompact: true })}</dd>
      </Fragment>
    ))}
  </dl>
)

export default RowDetail
