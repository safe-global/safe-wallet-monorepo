import { useMemo, useState, type ReactElement } from 'react'
import { ChevronDown, ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import type { SpaceQueueSafeItems } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@safe-global/views/components/ui/table'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import Identicon from '@/components/common/Identicon'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import { useChain } from '@/hooks/useChains'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import useWallet from '@/hooks/wallets/useWallet'
import SpaceQueueRow, { QUEUE_COLUMNS } from './SpaceQueueRow'
import { getNextNonce, getQueueStatus, getSectionRows, type QueueStatus } from './utils'

// Widths include the 16px cell padding on each side; a wider table spreads its extra width across all of them.
const COLUMN_WIDTHS: Record<(typeof QUEUE_COLUMNS)[number], string> = {
  Nonce: 'w-16',
  Transaction: 'w-[22rem]',
  Proposed: 'w-24',
  Note: 'w-[68px]',
  Signatures: 'w-28',
  Status: 'w-40',
  Action: 'w-36',
}

const SUMMARY_LABELS: Record<QueueStatus, string> = {
  execute: 'to execute',
  sign: 'to sign',
  waiting: 'waiting on others',
  blocked: 'blocked',
}
const SUMMARY_ORDER: QueueStatus[] = ['execute', 'sign', 'waiting', 'blocked']

const getSectionId = (section: SpaceQueueSafeItems): string => `${section.chainId}:${section.safeAddress.toLowerCase()}`

const SafeTitle = ({ chainId, safeAddress }: { chainId: string; safeAddress: string }): ReactElement => {
  const name = useSafeDisplayName(safeAddress, chainId)
  const chain = useChain(chainId)
  return (
    <span className="flex min-w-0 items-center gap-3">
      <Identicon address={safeAddress} size={24} />
      <span className="truncate font-medium text-foreground">{name || shortenAddress(safeAddress)}</span>
      {chain && (
        <Badge variant="outline" className="shrink-0 font-normal text-muted-foreground">
          {chain.chainLogoUri && <img src={chain.chainLogoUri} alt="" className="size-3.5 rounded-full" />}
          {chain.chainName}
        </Badge>
      )}
    </span>
  )
}

const SafeSection = ({
  section,
  collapsed,
  onToggle,
  walletAddress,
}: {
  section: SpaceQueueSafeItems
  collapsed: boolean
  onToggle: () => void
  walletAddress?: string
}): ReactElement => {
  const id = getSectionId(section)
  const rows = useMemo(() => getSectionRows(section.items), [section.items])
  const nextNonce = getNextNonce(rows)
  const statuses = rows.map((row) =>
    row.kind === 'transaction' ? getQueueStatus(row.item.transaction, row.isNext, walletAddress) : undefined,
  )
  const summary = SUMMARY_ORDER.flatMap((status) => {
    const count = statuses.filter((other) => other === status).length
    return count ? [`${count} ${SUMMARY_LABELS[status]}`] : []
  }).join(' · ')

  return (
    <SafeScopeProvider initial={{ chainId: section.chainId, safeAddress: section.safeAddress }} pollSafeInfo={false}>
      <TableBody data-testid="space-queue-safe">
        <TableRow data-no-hover data-no-divider className="group/band cursor-pointer" onClick={onToggle}>
          <TableCell className="rounded-l-lg bg-foreground/[0.03] py-0! transition-colors group-hover/band:bg-foreground/[0.06]">
            <span className="flex justify-center">
              <Button
                size="icon-sm"
                variant="ghost-muted"
                aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${shortenAddress(section.safeAddress)}`}
                aria-expanded={!collapsed}
                aria-controls={`space-queue-section-${id}`}
              >
                <ChevronDown className={`transition-transform ${collapsed ? '-rotate-90' : ''}`} />
              </Button>
            </span>
          </TableCell>
          <TableCell
            colSpan={QUEUE_COLUMNS.length - 1}
            className="rounded-r-lg bg-foreground/[0.03] py-0! pr-3! transition-colors group-hover/band:bg-foreground/[0.06]"
          >
            <div className="flex min-h-11 items-center gap-3 text-sm">
              <SafeTitle chainId={section.chainId} safeAddress={section.safeAddress} />
              {collapsed && summary && (
                <span className="ml-auto truncate text-xs tabular-nums text-muted-foreground">{summary}</span>
              )}
            </div>
          </TableCell>
        </TableRow>
      </TableBody>

      <TableBody id={`space-queue-section-${id}`} hidden={collapsed}>
        {rows.map((row, index) =>
          row.kind === 'conflict' ? (
            <TableRow key={`conflict-${row.nonce}-${index}`} data-no-hover data-no-divider>
              <TableCell className="pt-4 pb-1 text-center text-sm tabular-nums text-muted-foreground">
                {row.nonce}
              </TableCell>
              <TableCell colSpan={QUEUE_COLUMNS.length - 1} className="pt-4 pb-1">
                <span className="flex items-center gap-2 text-xs">
                  <Badge variant="warning">Conflicting</Badge>
                  <span className="text-muted-foreground">
                    Only 1/{row.size} transactions can execute. Once it does, the{' '}
                    {row.size === 2 ? 'other becomes' : 'others become'} invalid.
                  </span>
                </span>
              </TableCell>
            </TableRow>
          ) : (
            <SpaceQueueRow
              key={row.item.transaction.id}
              item={row.item}
              chainId={section.chainId}
              inConflict={row.inConflict}
              status={statuses[index] ?? 'waiting'}
              nextNonce={nextNonce}
            />
          ),
        )}
      </TableBody>
    </SafeScopeProvider>
  )
}

const CollapseAllButton = ({
  allCollapsed,
  count,
  onToggle,
}: {
  allCollapsed: boolean
  count: number
  onToggle: () => void
}): ReactElement => (
  // Chevrons always; the outline and the word show on header hover. The wrapper undoes the header's capitals.
  <span className="normal-case [&>button]:border-transparent [&>button]:shadow-none group-hover/head:[&>button]:border-border group-hover/head:[&>button]:shadow-xs group-focus-within/head:[&>button]:border-border group-focus-within/head:[&>button]:shadow-xs">
    <Button size="xs" variant="outline" aria-label={allCollapsed ? 'Expand all' : 'Collapse all'} onClick={onToggle}>
      <span className="opacity-0 transition-opacity group-hover/head:opacity-100 group-focus-within/head:opacity-100">
        {allCollapsed ? 'Expand' : 'Collapse'} {count} {count === 1 ? 'Safe' : 'Safes'}
      </span>
      {allCollapsed ? <ChevronsUpDown /> : <ChevronsDownUp />}
    </Button>
  </span>
)

const SpaceQueueTable = ({ sections }: { sections: SpaceQueueSafeItems[] }): ReactElement => {
  const wallet = useWallet()
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  const allCollapsed = sections.every((section) => collapsedIds.has(getSectionId(section)))

  const toggleSection = (id: string) =>
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      return next
    })

  const toggleAll = () => setCollapsedIds(allCollapsed ? new Set() : new Set(sections.map(getSectionId)))

  return (
    <Card radius="xl" size="none">
      <CardContent>
        <Table
          aria-label="Pending transactions"
          variant="panel"
          className="table-fixed min-w-[1080px] [&_td]:px-4 [&_th]:px-4"
        >
          <colgroup>
            {QUEUE_COLUMNS.map((label) => (
              <col key={label} className={COLUMN_WIDTHS[label]} />
            ))}
          </colgroup>
          <TableHeader>
            <TableRow data-no-hover className="group/head">
              {QUEUE_COLUMNS.map((label) => (
                <TableHead
                  key={label}
                  scope="col"
                  className={`text-xs text-muted-foreground ${label === 'Nonce' ? 'px-0! text-center' : ''}`}
                >
                  {label === 'Action' ? (
                    <span className="flex items-center justify-end">
                      <span className="sr-only">{label}</span>
                      <CollapseAllButton allCollapsed={allCollapsed} count={sections.length} onToggle={toggleAll} />
                    </span>
                  ) : (
                    label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          {sections.map((section) => {
            const id = getSectionId(section)
            return (
              <SafeSection
                key={id}
                section={section}
                collapsed={collapsedIds.has(id)}
                onToggle={() => toggleSection(id)}
                walletAddress={wallet?.address}
              />
            )
          })}
        </Table>
      </CardContent>
    </Card>
  )
}

export default SpaceQueueTable
