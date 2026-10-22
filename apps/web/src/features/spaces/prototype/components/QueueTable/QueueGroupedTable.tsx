import { Fragment } from 'react'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Table, TableBody, TableCell, TableRow } from '@safe-global/views/components/ui/table'
import type { BulkBatch } from '../../services/queue'
import {
  getColumnWidths,
  QueueSectionRows,
  QueueTableHead,
  SectionHeader,
  SectionToggle,
  useScrollOverflow,
  type CollapseAll,
  type QueueSectionProps,
} from './QueueSection'
import { getColumns, type QueueSectionData } from './sections'

export type QueueGroupedTableProps = Omit<QueueSectionProps, 'section' | 'collapsed' | 'onToggle' | 'safeBatch'> & {
  sections: QueueSectionData[]
  isCollapsed: (id: string) => boolean
  onToggle: (id: string) => void
  getSafeBatch: (section: QueueSectionData) => BulkBatch | undefined
  collapse: CollapseAll
}

// One table: a single column header, and each Safe is a band that collapses its rows.
export function QueueGroupedTable({
  sections,
  isCollapsed,
  onToggle,
  getSafeBatch,
  collapse,
  ...props
}: QueueGroupedTableProps) {
  const { isWide, showNoteText, persona, recoveries, alignTo } = props
  const columns = getColumns(isWide, alignTo)
  const widths = getColumnWidths(showNoteText, alignTo)
  const { scroller, overflowing } = useScrollOverflow(sections.map((section) => isCollapsed(section.id)).join())
  return (
    <Card radius="xl" size="none">
      <CardContent>
        <div ref={scroller} className="group/queue relative" data-overflow={overflowing || undefined}>
          <Table
            aria-label="Pending transactions"
            variant="panel"
            className="table-fixed min-w-[1080px] [&_td]:px-4 [&_th]:px-4"
          >
            <colgroup>
              {columns.map((label) => (
                <col key={label} className={widths[label]} />
              ))}
            </colgroup>
            <QueueTableHead columns={columns} collapse={collapse} />
            {sections.map((section) => {
              const collapsed = isCollapsed(section.id)
              const safeRecoveries = recoveries?.forAccount(section.account.id) ?? []
              return (
                <Fragment key={section.id}>
                  <TableBody>
                    <TableRow data-no-hover data-no-divider className="group/band">
                      <TableCell
                        className="cursor-pointer rounded-l-lg bg-foreground/[0.03] py-0! transition-colors group-hover/band:bg-foreground/[0.06]"
                        onClick={() => onToggle(section.id)}
                      >
                        <span className="flex justify-center">
                          <SectionToggle section={section} collapsed={collapsed} />
                        </span>
                      </TableCell>
                      <TableCell
                        colSpan={columns.length - 1}
                        className="rounded-r-lg bg-foreground/[0.03] py-0! pr-3! transition-colors group-hover/band:bg-foreground/[0.06]"
                      >
                        <SectionHeader
                          section={section}
                          collapsed={collapsed}
                          onToggle={() => onToggle(section.id)}
                          safeBatch={getSafeBatch(section)}
                          onBulkExecute={props.onBulkExecute}
                          persona={persona}
                          recoveryCount={safeRecoveries.length}
                          onOpenSafe={props.onOpenSafe}
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                  <TableBody id={`section-${section.id}`} hidden={collapsed}>
                    <QueueSectionRows {...props} section={section} columns={columns} safeRecoveries={safeRecoveries} />
                  </TableBody>
                </Fragment>
              )
            })}
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
