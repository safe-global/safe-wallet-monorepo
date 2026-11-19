import type { ReactNode } from 'react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Table, TableCell, TableRow } from '@safe-global/views/components/ui/table'
import { cn } from '@safe-global/views/utils/cn'

const BAND_CELL = 'bg-foreground/[0.03] py-0!'
const BAND_LABEL = 'text-xs font-semibold uppercase text-muted-foreground'

/** A gray band that starts a group; with `columns` it repeats the column titles after the group name. */
export const GroupBand = ({
  title,
  count,
  columnCount,
  columns,
}: {
  title: string
  count: number
  columnCount: number
  columns?: string[]
}) => {
  const label = (
    <div className="flex min-h-10 items-center gap-2">
      <span className={columns ? BAND_LABEL : 'text-sm font-medium text-foreground'}>{title}</span>
      <Badge variant="subtle">{count}</Badge>
    </div>
  )
  if (!columns)
    return (
      <TableRow data-no-hover data-no-divider>
        <TableCell colSpan={columnCount} className={`rounded-lg ${BAND_CELL}`}>
          {label}
        </TableCell>
      </TableRow>
    )
  return (
    <TableRow data-no-hover data-no-divider>
      <TableCell className={`rounded-l-lg ${BAND_CELL}`}>{label}</TableCell>
      {columns.map((column) => (
        <TableCell key={column} className={cn(BAND_LABEL, BAND_CELL)}>
          {column}
        </TableCell>
      ))}
      <TableCell colSpan={columnCount - columns.length - 1} className={`rounded-r-lg ${BAND_CELL}`} />
    </TableRow>
  )
}

export const TableCard = ({
  label,
  widths,
  className,
  children,
}: {
  label: string
  widths: string[]
  className?: string
  children: ReactNode
}) => (
  <Card radius="xl" size="none">
    <CardContent>
      <Table aria-label={label} variant="panel" className={cn('table-fixed [&_td]:px-4 [&_th]:px-4', className)}>
        <colgroup>
          {widths.map((width, index) => (
            <col key={index} className={width || undefined} />
          ))}
        </colgroup>
        {children}
      </Table>
    </CardContent>
  </Card>
)
