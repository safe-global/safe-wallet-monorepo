import { Fragment } from 'react'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Table, TableBody, TableCell, TableRow } from '@safe-global/views/components/ui/table'
import type { BulkBatch } from '../../services/queue'
import {
  getColumnWidths,
  QueueSectionRows,
  QueueTableHead,
  SectionHeader,
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

// One table: a single column header, and each Safe or status is a band that collapses its rows.
export function QueueGroupedTable({
  sections,
  isCollapsed,
  onToggle,
  getSafeBatch,
  collapse,
  ...props
}: QueueGroupedTableProps) {
  const { groupBy, steps, isWide, showNoteText, persona, recoveries } = props
  const columns = getColumns(groupBy, isWide, steps)
  const widths = getColumnWidths(isWide, steps, showNoteText)
  const { scroller, overflowing } = useScrollOverflow(steps, sections.map((section) => isCollapsed(section.id)).join())
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
            <QueueTableHead
              columns={columns}
              groupBy={groupBy}
              steps={steps}
              onGroupByChange={props.onGroupByChange}
              collapse={collapse}
            />
            {sections.map((section) => {
              const collapsed = isCollapsed(section.id)
              const safeRecoveries =
                groupBy === 'safe' && section.account ? (recoveries?.forAccount(section.account.id) ?? []) : []
              return (
                <Fragment key={section.id}>
                  <TableBody>
                    <TableRow data-no-hover data-no-divider>
                      <TableCell
                        colSpan={columns.length}
                        className="rounded-lg bg-foreground/[0.03] py-0! pl-2! pr-3! transition-colors hover:bg-foreground/[0.06]"
                      >
                        <SectionHeader
                          inTable
                          section={section}
                          collapsed={collapsed}
                          onToggle={() => onToggle(section.id)}
                          safeBatch={getSafeBatch(section)}
                          onBulkExecute={props.onBulkExecute}
                          steps={steps}
                          persona={persona}
                          recoveryCount={safeRecoveries.length}
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
