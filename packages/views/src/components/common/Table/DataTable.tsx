import type { ReactElement } from 'react'
import { Typography } from '@safe-global/views/components/ui/typography'
import type { DataRow } from '@safe-global/views/components/common/Table/DataRow'

type DataTableProps = {
  header?: string
  rows: ReactElement<typeof DataRow>[]
}

export const DataTable = ({ header, rows }: DataTableProps): ReactElement | null => {
  return (
    <div className="flex flex-col gap-1">
      {header && <Typography variant="paragraph-bold">{header}</Typography>}
      {rows.map((row) => {
        return row
      })}
    </div>
  )
}
