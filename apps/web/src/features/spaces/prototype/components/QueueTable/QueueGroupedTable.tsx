import { Fragment, useState } from 'react'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Button } from '@safe-global/views/components/ui/button'
import { Table, TableBody, TableCell, TableRow } from '@safe-global/views/components/ui/table'
import type { BulkBatch } from '../../services/queue'
import { getAccount } from '../../services/model'
import type { Account } from '../../types'
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
import { FailedSafeBand } from '../LoadWarnings'
import { isActionGroup, type OrderedGroupBy, type QueueGroup } from '../../services/order'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { SafeIdentity, chainLogoUrl } from '../shared'
import { groupBySafe, type QueueSectionData, type SafeGroup } from './sections'

export type QueueGroupedTableProps = Omit<QueueSectionProps, 'section' | 'collapsed' | 'onToggle' | 'safeBatch'> & {
  sections: QueueSectionData[]
  isCollapsed: (id: string) => boolean
  onToggle: (id: string) => void
  getSafeBatch: (section: QueueSectionData) => BulkBatch | undefined
  collapse: CollapseAll
  // Safes that didn't load keep a band at the top, with Reload.
  failedSafes?: { accounts: Account[]; retrying: string[]; onRetry: (ids: string[]) => void }
}

const BAND_CELL = 'bg-foreground/[0.03] py-0! transition-colors group-hover/band:bg-foreground/[0.06]'

// Grouped by Safe: one band per Safe, a sub-header per network, the same columns as the other groupings.
export function QueueGroupedTable({
  sections,
  isCollapsed,
  onToggle,
  getSafeBatch,
  collapse,
  failedSafes,
  ...props
}: QueueGroupedTableProps) {
  const { isWide, showNoteText, persona, recoveries } = props
  const columns = ORDERED_COLUMNS(isWide, props.partyTags, props.compact)
  const widths = orderedWidths(showNoteText, props.partyTags, props.compact)
  const groups: SafeGroup[] = groupBySafe(sections)
  const { scroller, overflowing } = useScrollOverflow(sections.map((section) => isCollapsed(section.id)).join())
  const rows = (section: QueueSectionData, hidden: boolean) => (
    <TableBody id={`section-${section.id}`} hidden={hidden}>
      <QueueSectionRows
        {...props}
        section={section}
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
                section={section}
                collapsed={collapsed}
                onToggle={() => onToggle(section.id)}
                safeBatch={getSafeBatch(section)}
                onBulkExecute={props.onBulkExecute}
                persona={persona}
                recoveryCount={recoveries?.forAccount(section.account.id).length ?? 0}
                label={group.label}
                chains={<ChainToggles sections={group.sections} isCollapsed={isCollapsed} onToggle={onToggle} />}
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
    const all = { ...group.sections[0], items: group.sections.flatMap((section) => section.items) }
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
                  {collapsed && <SafeSummary section={all} persona={persona} recoveryCount={recoveryCount} />}
                  {/* One batch per network: bulk execute doesn't cross networks in v1. */}
                  {group.sections.map((section) => {
                    const safeBatch = getSafeBatch(section)
                    return (
                      safeBatch &&
                      safeBatch.proposals.length > 1 && (
                        <Button
                          key={section.id}
                          size="2xs"
                          variant="outline"
                          onClick={(event) => {
                            event.stopPropagation()
                            props.onBulkExecute(safeBatch.account.id)
                          }}
                        >
                          Bulk execute {safeBatch.proposals.length}
                          {group.sections.length > 1 && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              ·
                              <img
                                src={chainLogoUrl(section.account.chainId)}
                                alt=""
                                className="size-3.5 rounded-full"
                              />
                              {section.account.network}
                            </span>
                          )}
                        </Button>
                      )
                    )
                  })}
                </span>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
        {group.sections.map((section) => {
          const chainCollapsed = isCollapsed(section.id)
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
                            section={section}
                            persona={persona}
                            recoveryCount={recoveries?.forAccount(section.account.id).length ?? 0}
                          />
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
            className={`table-fixed ${props.compact ? '[&_td]:px-2 [&_th]:px-2' : 'min-w-[1300px] [&_td]:px-4 [&_th]:px-4'}`}
          >
            <colgroup>
              {columns.map((label) => (
                <col key={label} className={widths[label]} />
              ))}
            </colgroup>
            <QueueTableHead columns={columns} collapse={{ ...collapse, count: groups.length }} />
            {/* Safes that didn't load come first, so nobody misses them. */}
            {failedSafes?.accounts.map((account) => (
              <TableBody key={`failed-${account.id}`}>
                <FailedSafeBand
                  account={account}
                  columnCount={columns.length}
                  loading={failedSafes.retrying.includes(account.id)}
                  onRetry={() => failedSafes.onRetry([account.id])}
                />
              </TableBody>
            ))}
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

export type QueueOrderedTableProps = Omit<
  QueueGroupedTableProps,
  'sections' | 'isCollapsed' | 'onToggle' | 'getSafeBatch' | 'collapse'
> & { groups: QueueGroup[]; groupBy: OrderedGroupBy }

// Transaction fits the widest action and To takes the slack.
// Option E fits the Safe tag in Transaction, in place of the Safe column.
const orderedWidths = (
  showNoteText: boolean | undefined,
  partyTags = false,
  compact = false,
): Record<string, string | undefined> => ({
  ...getColumnWidths(showNoteText),
  Transaction: compact ? undefined : partyTags ? 'w-[24rem]' : 'w-72',
  ...(compact ? { Nonce: 'w-11', Action: 'w-12' } : {}),
  To: undefined,
  Safe: 'w-44',
  Network: partyTags ? 'w-20' : 'w-24',
  // Option E's badges name states, such as Awaiting 2 · after #42, so the column is wider.
  Status: partyTags ? 'w-48' : 'w-32',
})

// Columns for options D and E, the same in every grouping. Nonce leads, so conflicts draw the same bracket.
export const ORDERED_COLUMNS = (isWide: boolean, partyTags = false, compact = false) =>
  compact
    ? ['Nonce', 'Transaction', 'Action']
    : [
        'Nonce',
        'Transaction',
        'To',
        // Option E shows the Safe and its network in the Safe tag.
        ...(partyTags ? [] : ['Safe', 'Network']),
        'Proposed',
        ...(isWide ? ['Note'] : []),
        'Signatures',
        'Status',
        'Action',
      ]

// Option D: rows grouped by status, network or next nonce. Each group collapses, and the header collapses them all.
export function QueueOrderedTable({ groups, groupBy, ...props }: QueueOrderedTableProps) {
  const byNetwork = groupBy === 'network'
  const columns = ORDERED_COLUMNS(props.isWide, props.partyTags, props.compact)
  const widths = orderedWidths(props.showNoteText, props.partyTags, props.compact)
  const [collapsed, setCollapsed] = useState<string[]>([])
  const { scroller, overflowing } = useScrollOverflow(`${groups.length}:${collapsed.join()}`)
  const toggle = (id: string) =>
    setCollapsed((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]))
  const nothingForYou = groupBy === 'status' && !groups.some(isActionGroup)
  const allCollapsed = groups.length > 0 && groups.every((group) => collapsed.includes(group.id))
  return (
    <Card radius="xl" size="none">
      <CardContent>
        <div ref={scroller} className="group/queue relative" data-overflow={overflowing || undefined}>
          <Table
            aria-label="Pending transactions"
            variant="panel"
            className={`table-fixed ${props.compact ? '[&_td]:px-2 [&_th]:px-2' : 'min-w-[1300px] [&_td]:px-4 [&_th]:px-4'}`}
          >
            <colgroup>
              {columns.map((column) => (
                <col key={column} className={widths[column]} />
              ))}
            </colgroup>
            <QueueTableHead
              columns={columns}
              collapse={{
                allCollapsed,
                onToggle: () => setCollapsed(allCollapsed ? [] : groups.map((group) => group.id)),
                count: groups.length,
                unit: byNetwork ? ['network', 'networks'] : ['group', 'groups'],
              }}
            />
            {nothingForYou && (
              <TableBody>
                <TableRow data-no-hover data-no-divider>
                  <TableCell colSpan={columns.length} className="py-4 text-sm text-muted-foreground">
                    Nothing needs your action right now.
                  </TableCell>
                </TableRow>
              </TableBody>
            )}
            {groups.map((group) => {
              const isCollapsed = collapsed.includes(group.id)
              const section = {
                id: group.id,
                label: group.label,
                account: getAccount(group.rows[0]),
                items: group.rows,
              }
              return (
                <Fragment key={group.id}>
                  <TableBody>
                    {/* Laid out like a Safe band: the toggle under Nonce, the title in line with Transaction. */}
                    <TableRow
                      data-no-hover
                      data-no-divider
                      className="group/band cursor-pointer"
                      onClick={() => toggle(group.id)}
                    >
                      <TableCell className={`rounded-l-lg ${BAND_CELL}`}>
                        <span className="flex justify-center">
                          <SectionToggle section={group} collapsed={isCollapsed} controls={`rows-${group.id}`} />
                        </span>
                      </TableCell>
                      <TableCell colSpan={columns.length - 1} className={`rounded-r-lg pr-3! ${BAND_CELL}`}>
                        <h3 className="flex min-h-11 items-center gap-3 text-sm font-medium">
                          {byNetwork && (
                            <img src={chainLogoUrl(group.chainId!)} alt="" className="size-6 shrink-0 rounded-full" />
                          )}
                          <span className="truncate">{group.label}</span>
                          <span className="font-normal tabular-nums text-muted-foreground">{group.rows.length}</span>
                        </h3>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                  <TableBody id={`rows-${group.id}`} hidden={isCollapsed}>
                    <QueueSectionRows {...props} section={section} columns={columns} safeRecoveries={[]} />
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
