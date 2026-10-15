import { ChevronDown, ChevronUp, ListTree } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@safe-global/views/components/ui/table'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import type { BulkBatch } from '../../services/queue'
import type { Persona, Proposal } from '../../types'
import { SafeIdentity, STATUS_META, type GroupBy } from '../shared'
import { QueueRow } from './QueueRow'
import { getColumns, type QueueSectionData } from './sections'

const columnWidths = (isWide: boolean): Record<string, string | undefined> => ({
  Type: isWide ? 'w-56' : 'w-44',
  Safe: isWide ? 'w-[18%]' : 'w-[22%]',
  Network: 'w-16',
  Signatures: isWide ? 'w-40' : 'w-24',
  Note: 'w-16',
  Action: 'w-24',
})

export type QueueSectionProps = {
  section: QueueSectionData
  items: Proposal[]
  persona: Persona
  groupBy: GroupBy
  isWide: boolean
  collapsed: boolean
  onToggle: () => void
  safeBatch?: BulkBatch
  onBulkExecute: (accountId: string) => void
  onGroupByChange: (groupBy: GroupBy) => void
  reviewId?: string
  bulkHover: string[]
  replaceHover: string | null
  onReplaceHover: (id: string | null) => void
  onReview: (tx: Proposal) => void
}

function SectionHeader({
  section,
  collapsed,
  onToggle,
  safeBatch,
  onBulkExecute,
}: Pick<QueueSectionProps, 'section' | 'collapsed' | 'onToggle' | 'safeBatch' | 'onBulkExecute'>) {
  const safeAccount = section.account
  const status = section.category in STATUS_META ? STATUS_META[section.category as keyof typeof STATUS_META] : null
  return (
    <div
      data-slot="section-header"
      className="group/section flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-foreground/[0.04] has-[:focus-visible]:bg-foreground/[0.04]"
      onClick={onToggle}
    >
      {safeAccount ? (
        <SafeIdentity address={safeAccount.iconAddress} size={32} className="flex min-w-0 items-center gap-3">
          <span className="flex min-w-0 flex-col">
            <span className="truncate">{section.label}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">
              {safeAccount.network} · <span className="font-mono">{safeAccount.address}</span>
            </span>
          </span>
        </SafeIdentity>
      ) : (
        <>
          {status && (
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-md ${status.tone}`}
              aria-hidden="true"
            >
              <status.icon className="size-4" strokeWidth={ICON_STROKE} />
            </span>
          )}
          {section.label}
          <Badge variant="outline">{section.items.length}</Badge>
        </>
      )}
      <div className="ml-auto flex items-center gap-2">
        {safeBatch && safeBatch.proposals.length > 1 && (
          <Button
            size="2xs"
            variant="outline"
            onClick={(event) => {
              event.stopPropagation()
              onBulkExecute(safeBatch.account.id)
            }}
          >
            Bulk execute {safeBatch.proposals.length}
          </Button>
        )}
        <Button
          size="icon-sm"
          variant="ghost-muted"
          aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${section.label}`}
          aria-expanded={!collapsed}
          aria-controls={`section-${section.id}`}
        >
          {collapsed ? <ChevronDown /> : <ChevronUp />}
        </Button>
      </div>
    </div>
  )
}

export function QueueSection({
  section,
  items,
  persona,
  groupBy,
  isWide,
  collapsed,
  onToggle,
  safeBatch,
  onBulkExecute,
  onGroupByChange,
  reviewId,
  bulkHover,
  replaceHover,
  onReplaceHover,
  onReview,
}: QueueSectionProps) {
  const grouped = groupBy !== 'none'
  const columns = getColumns(groupBy, isWide)
  const widths = columnWidths(isWide)
  return (
    <section className="flex flex-col gap-2">
      {grouped && (
        <SectionHeader
          section={section}
          collapsed={collapsed}
          onToggle={onToggle}
          safeBatch={safeBatch}
          onBulkExecute={onBulkExecute}
        />
      )}
      <div id={`section-${section.id}`} hidden={collapsed}>
        <Card radius="xl" size="none">
          <CardContent>
            <div className="relative">
              <Table
                aria-label={grouped ? `${section.label} transactions` : 'Pending transactions'}
                variant="panel"
                className="table-fixed max-md:min-w-[900px]"
              >
                <colgroup>
                  {columns.map((label) => (
                    <col key={label} className={widths[label]} />
                  ))}
                </colgroup>
                <TableHeader>
                  <TableRow data-no-hover>
                    {columns.map((label, index) => {
                      const groupTarget =
                        label === 'Safe' && groupBy !== 'safe'
                          ? 'safe'
                          : label === 'Status' && !grouped
                            ? 'status'
                            : null
                      return (
                        <TableHead
                          key={label}
                          scope="col"
                          className={`text-xs text-muted-foreground ${index === 0 ? 'max-md:sticky max-md:left-0 max-md:z-20' : ''}`}
                        >
                          {label === 'Action' ? (
                            <span className="sr-only">{label}</span>
                          ) : groupTarget ? (
                            <span className="flex items-center gap-1">
                              {label}
                              <Tooltip delay={150}>
                                <TooltipTrigger
                                  render={
                                    <Button
                                      size="icon-xs"
                                      variant="ghost-muted"
                                      aria-label={`Group by ${groupTarget === 'safe' ? 'Safe' : 'status'}`}
                                      onClick={() => onGroupByChange(groupTarget)}
                                    />
                                  }
                                >
                                  <ListTree />
                                </TooltipTrigger>
                                <TooltipContent>Group by {groupTarget === 'safe' ? 'Safe' : 'status'}</TooltipContent>
                              </Tooltip>
                            </span>
                          ) : (
                            label
                          )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {section.items.map((tx) => (
                    <QueueRow
                      key={tx.id}
                      tx={tx}
                      sectionItems={section.items}
                      items={items}
                      persona={persona}
                      groupBy={groupBy}
                      isWide={isWide}
                      columnCount={columns.length}
                      selected={reviewId === tx.id}
                      highlighted={bulkHover.includes(tx.id)}
                      replaceHover={replaceHover}
                      onReplaceHover={onReplaceHover}
                      onReview={onReview}
                    />
                  ))}
                  {!section.items.length && (
                    <TableRow data-no-hover data-no-divider>
                      <TableCell colSpan={columns.length} className="py-6 text-center text-muted-foreground">
                        No matching proposals
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-card to-transparent md:hidden"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
