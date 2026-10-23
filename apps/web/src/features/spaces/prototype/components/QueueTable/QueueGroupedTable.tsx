import { Fragment, useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Button } from '@safe-global/views/components/ui/button'
import { Spinner } from '@safe-global/views/components/ui/spinner'
import { Table, TableBody, TableCell, TableRow } from '@safe-global/views/components/ui/table'
import type { BulkBatch } from '../../services/queue'
import { getAccount } from '../../services/model'
import type { Proposal } from '../../types'
import {
  getColumnWidths,
  QueueSectionRows,
  QueueTableHead,
  SafeSummary,
  SectionHeader,
  SectionToggle,
  useScrollOverflow,
  type CollapseAll,
  type QueueSectionProps,
} from './QueueSection'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { SafeIdentity, chainLogoUrl } from '../shared'
import { getColumns, groupBySafe, shareLimit, type QueueSectionData, type SafeGroup } from './sections'

export type QueueGroupedTableProps = Omit<QueueSectionProps, 'section' | 'collapsed' | 'onToggle' | 'safeBatch'> & {
  sections: QueueSectionData[]
  isCollapsed: (id: string) => boolean
  onToggle: (id: string) => void
  getSafeBatch: (section: QueueSectionData) => BulkBatch | undefined
  collapse: CollapseAll
}

const BAND_CELL = 'bg-foreground/[0.03] py-0! transition-colors group-hover/band:bg-foreground/[0.06]'

// One table: a single column header, and each Safe is a band that collapses its rows.
export function QueueGroupedTable({
  sections,
  isCollapsed,
  onToggle,
  getSafeBatch,
  collapse,
  ...props
}: QueueGroupedTableProps) {
  const { isWide, showNoteText, persona, recoveries, alignTo, simple, safeTable = false, pageSize = 10 } = props
  // Option A: one band per Safe and a sub-header per network, in place of the Chain column.
  const columns = getColumns(isWide, alignTo).filter((column) => !safeTable || column !== 'Chain')
  // Option A: Transaction fits the widest action and To takes the slack, so a row reads as one short sentence.
  const widths = safeTable
    ? { ...getColumnWidths(showNoteText, alignTo), Transaction: 'w-[21.5rem]', To: undefined }
    : getColumnWidths(showNoteText, alignTo)
  const groups: SafeGroup[] = safeTable
    ? groupBySafe(sections)
    : sections.map((section) => ({ id: section.id, label: section.label, sections: [section] }))
  const { scroller, overflowing } = useScrollOverflow(sections.map((section) => isCollapsed(section.id)).join())
  // Across Safes, each Safe shows a first page shared by its networks. Narrowed to one Safe, it shows everything.
  const limited = safeTable && groups.length > 1
  const pages = new Map(
    limited ? groups.flatMap((group) => shareLimit(group.sections, pageSize)).map((page) => [page.id, page]) : [],
  )
  const paged = (section: QueueSectionData) => pages.get(section.id) ?? section
  const hasMore = (section: QueueSectionData) => paged(section).items.length < section.items.length

  const seeAll = (group: SafeGroup) =>
    group.sections.some(hasMore) &&
    props.onSeeMore && (
      <SeeAllButton
        label={group.label}
        onSeeAll={() => props.onSeeMore!(group.sections.map((section) => section.account.id))}
      />
    )

  const rows = (section: QueueSectionData, hidden: boolean) => (
    <TableBody id={`section-${section.id}`} hidden={hidden}>
      <QueueSectionRows
        {...props}
        section={paged(section)}
        columns={columns}
        safeRecoveries={recoveries?.forAccount(section.account.id) ?? []}
      />
    </TableBody>
  )

  const singleSafe = (group: SafeGroup) => {
    const [section] = group.sections
    const collapsed = isCollapsed(section.id)
    return (
      <Fragment key={section.id}>
        <TableBody>
          <TableRow data-no-hover data-no-divider className="group/band">
            <TableCell className={`cursor-pointer rounded-l-lg ${BAND_CELL}`} onClick={() => onToggle(section.id)}>
              <span className="flex justify-center">
                <SectionToggle section={section} collapsed={collapsed} />
              </span>
            </TableCell>
            <TableCell colSpan={columns.length - 1} className={`rounded-r-lg pr-3! ${BAND_CELL}`}>
              <SectionHeader
                section={paged(section)}
                more={hasMore(section)}
                collapsed={collapsed}
                onToggle={() => onToggle(section.id)}
                safeBatch={getSafeBatch(section)}
                onBulkExecute={props.onBulkExecute}
                persona={persona}
                recoveryCount={recoveries?.forAccount(section.account.id).length ?? 0}
                onOpenSafe={props.onOpenSafe}
                simple={simple}
                items={props.items}
                label={safeTable ? group.label : undefined}
                actions={seeAll(group)}
                chains={
                  safeTable && <ChainToggles sections={group.sections} isCollapsed={isCollapsed} onToggle={onToggle} />
                }
              />
            </TableCell>
          </TableRow>
        </TableBody>
        {rows(section, collapsed)}
      </Fragment>
    )
  }

  const multiChainSafe = (group: SafeGroup) => {
    const collapsed = group.sections.every((section) => isCollapsed(section.id))
    // Opens every network, or closes the open ones.
    const toggleGroup = () =>
      group.sections
        .filter((section) => isCollapsed(section.id) === collapsed)
        .forEach((section) => onToggle(section.id))
    const { account } = group.sections[0]
    const all = { ...group.sections[0], items: group.sections.flatMap((section) => paged(section).items) }
    const recoveryCount = group.sections.reduce(
      (sum, section) => sum + (recoveries?.forAccount(section.account.id).length ?? 0),
      0,
    )
    return (
      <Fragment key={group.id}>
        <TableBody>
          <TableRow data-no-hover data-no-divider className="group/band cursor-pointer" onClick={toggleGroup}>
            <TableCell className={`rounded-l-lg ${BAND_CELL}`}>
              <span className="flex justify-center">
                <SectionToggle
                  section={group}
                  collapsed={collapsed}
                  controls={group.sections.map((section) => `chain-${section.id}`).join(' ')}
                />
              </span>
            </TableCell>
            <TableCell colSpan={columns.length - 1} className={`rounded-r-lg pr-3! ${BAND_CELL}`}>
              <div className="flex min-h-11 items-center gap-3 text-sm font-medium">
                <SafeIdentity
                  address={account.iconAddress}
                  size={24}
                  className="flex min-w-0 items-center gap-3"
                  title={group.label}
                  details={[
                    { label: 'Networks', value: group.sections.map((section) => section.account.network).join(', ') },
                  ]}
                >
                  <span className="truncate font-medium text-foreground">{group.label}</span>
                </SafeIdentity>
                <ChainToggles sections={group.sections} isCollapsed={isCollapsed} onToggle={onToggle} />
                <span className="ml-auto flex items-center gap-2">
                  {collapsed && (
                    <SafeSummary
                      section={all}
                      persona={persona}
                      recoveryCount={recoveryCount}
                      more={group.sections.some(hasMore)}
                    />
                  )}
                  {seeAll(group)}
                </span>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
        {group.sections.map((section) => {
          const chainCollapsed = isCollapsed(section.id)
          const safeBatch = getSafeBatch(section)
          return (
            <Fragment key={section.id}>
              <TableBody id={`chain-${section.id}`} hidden={collapsed}>
                <TableRow data-no-hover className="cursor-pointer" onClick={() => onToggle(section.id)}>
                  <TableCell className="py-0!">
                    <span className="flex justify-center">
                      <SectionToggle section={section} collapsed={chainCollapsed} size="icon-xs" />
                    </span>
                  </TableCell>
                  <TableCell colSpan={columns.length - 1} className="py-0! pr-3!">
                    <div className="flex h-6 items-center gap-2 text-xs">
                      <img src={chainLogoUrl(section.account.chainId)} alt="" className="size-4 rounded-full" />
                      <span className="font-medium">{section.account.network}</span>
                      <span className="font-mono text-muted-foreground">Next #{section.account.nextNonce}</span>
                      <span className="ml-auto flex items-center gap-2">
                        {chainCollapsed && (
                          <SafeSummary
                            section={paged(section)}
                            more={hasMore(section)}
                            persona={persona}
                            recoveryCount={recoveries?.forAccount(section.account.id).length ?? 0}
                          />
                        )}
                        {safeBatch && safeBatch.proposals.length > 1 && (
                          <Button
                            size="2xs"
                            variant="outline"
                            onClick={(event) => {
                              event.stopPropagation()
                              props.onBulkExecute(safeBatch.account.id)
                            }}
                          >
                            Bulk execute {safeBatch.proposals.length}
                          </Button>
                        )}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
              {rows(section, collapsed || chainCollapsed)}
            </Fragment>
          )
        })}
      </Fragment>
    )
  }

  return (
    <Card radius="xl" size="none">
      <CardContent>
        <div ref={scroller} className="group/queue relative" data-overflow={overflowing || undefined}>
          <Table
            aria-label="Pending transactions"
            variant="panel"
            className={`table-fixed [&_td]:px-4 [&_th]:px-4 ${safeTable ? 'min-w-[1160px]' : 'min-w-[1080px]'}`}
          >
            <colgroup>
              {columns.map((label) => (
                <col key={label} className={widths[label]} />
              ))}
            </colgroup>
            <QueueTableHead columns={columns} collapse={safeTable ? { ...collapse, count: groups.length } : collapse} />
            {groups.map((group) => (group.sections.length > 1 ? multiChainSafe(group) : singleSafe(group)))}
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

// The Safe's networks. A logo opens its network and closes the others; on the only open network it reopens them all.
// A closed network's logo is greyed out.
function ChainToggles({
  sections,
  isCollapsed,
  onToggle,
}: {
  sections: QueueSectionData[]
  isCollapsed: (id: string) => boolean
  onToggle: (id: string) => void
}) {
  const onlyOpen = (id: string) => sections.every((section) => isCollapsed(section.id) === (section.id !== id))
  const focus = (id: string) => {
    const all = onlyOpen(id)
    sections
      .filter((section) => isCollapsed(section.id) === (all || section.id === id))
      .forEach((section) => onToggle(section.id))
  }
  return (
    <span className="flex shrink-0 -space-x-1">
      {sections.map((section) => {
        const collapsed = isCollapsed(section.id)
        const { chainId, network } = section.account
        return (
          <Tooltip key={section.id} delay={150}>
            <TooltipTrigger
              aria-label={
                onlyOpen(section.id) && sections.length > 1 ? `Show all ${sections.length} networks` : `Show ${network}`
              }
              aria-expanded={!collapsed}
              aria-controls={`section-${section.id}`}
              className="relative flex rounded-full ring-2 ring-card hover:z-10 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-ring"
              onClick={(event) => {
                event.stopPropagation()
                focus(section.id)
              }}
            >
              <img
                src={chainLogoUrl(chainId)}
                alt=""
                className={`size-4 rounded-full transition-[filter,opacity] ${collapsed ? 'opacity-50 grayscale' : ''}`}
              />
            </TooltipTrigger>
            <TooltipContent>{network}</TooltipContent>
          </Tooltip>
        )
      })}
    </span>
  )
}

// Across Safes only a first page is loaded, and the queue service gives no total. This loads the rest of one Safe.
function SeeAllButton({ label, onSeeAll }: { label: string; onSeeAll: () => void }) {
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  return (
    <Button
      size="2xs"
      variant="outline"
      aria-label={`See all in ${label}`}
      disabled={loading}
      onClick={(event) => {
        event.stopPropagation()
        setLoading(true)
        // A short wait, as fetching the Safe's whole queue would take.
        timer.current = setTimeout(onSeeAll, 600)
      }}
    >
      {loading ? (
        <>
          <Spinner className="size-3" /> Loading…
        </>
      ) : (
        <>
          See all <ArrowRight />
        </>
      )}
    </Button>
  )
}

export type QueueFlatTableProps = Omit<
  QueueGroupedTableProps,
  'sections' | 'isCollapsed' | 'onToggle' | 'getSafeBatch' | 'collapse'
> & { rows: Proposal[]; label: string }

// Option C: one list across Safes, no bands. Conflict options still group by nonce within their Safe.
export function QueueFlatTable({ rows, label, ...props }: QueueFlatTableProps) {
  // Option A's columns, with the Safe and its chain in place of Chain.
  const columns = getColumns(props.isWide, props.alignTo).map((column) => (column === 'Chain' ? 'Safe' : column))
  const widths = getColumnWidths(props.showNoteText, props.alignTo)
  const { scroller, overflowing } = useScrollOverflow(rows.length)
  const section = { id: 'needs-you', label, account: getAccount(rows[0]), items: rows }
  return (
    <Card radius="xl" size="none">
      <CardContent>
        <div ref={scroller} className="group/queue relative" data-overflow={overflowing || undefined}>
          <Table aria-label={label} variant="panel" className="table-fixed min-w-[1300px] [&_td]:px-4 [&_th]:px-4">
            <colgroup>
              {columns.map((column) => (
                <col key={column} className={widths[column]} />
              ))}
            </colgroup>
            <QueueTableHead columns={columns} />
            <TableBody>
              <QueueSectionRows {...props} section={section} columns={columns} safeRecoveries={[]} labelLastSignature />
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
