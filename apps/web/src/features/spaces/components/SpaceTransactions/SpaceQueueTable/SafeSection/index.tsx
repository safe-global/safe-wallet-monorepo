import { useMemo, type ReactElement } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { TableBody, TableCell, TableRow } from '@safe-global/views/components/ui/table'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { SpaceQueueSection } from '../../../../store/spaceQueueApi'
import { QUEUE_COLUMNS } from '../../SpaceQueueRow'
import { getNextNonce, getQueueStatus, getSafeKey, getSectionRows, type QueueStatus } from '../../utils'
import ChainSection, { getChainSectionId, type ChainRows } from '../ChainSection'
import SafeTitle from '../SafeTitle'

const SUMMARY_LABELS: Record<QueueStatus, string> = {
  execute: 'to execute',
  sign: 'to sign',
  waiting: 'waiting on others',
  blocked: 'blocked',
}
const SUMMARY_ORDER: QueueStatus[] = ['execute', 'sign', 'waiting', 'blocked']

const SafeSection = ({
  section,
  collapsed,
  onToggle,
  walletAddress,
}: {
  section: SpaceQueueSection
  collapsed: boolean
  onToggle: () => void
  walletAddress?: string
}): ReactElement => {
  const id = getSafeKey(section.safeAddress)
  const chains = useMemo<ChainRows[]>(
    () =>
      section.chains.map(({ chainId, items }) => {
        const rows = getSectionRows(items)
        return {
          chainId,
          rows,
          nextNonce: getNextNonce(rows),
          statuses: rows.map((row) =>
            row.kind === 'transaction' ? getQueueStatus(row.item.transaction, row.isNext, walletAddress) : undefined,
          ),
        }
      }),
    [section.chains, walletAddress],
  )
  const statuses = chains.flatMap((chain) => chain.statuses)
  const summary = SUMMARY_ORDER.flatMap((status) => {
    const count = statuses.filter((other) => other === status).length
    return count ? [`${count} ${SUMMARY_LABELS[status]}`] : []
  }).join(' · ')

  return (
    <>
      <TableBody data-testid="space-queue-safe">
        <TableRow data-no-hover data-no-divider className="group/band cursor-pointer" onClick={onToggle}>
          <TableCell className="rounded-l-lg bg-foreground/[0.03] py-0! transition-colors group-hover/band:bg-foreground/[0.06]">
            <span className="flex justify-center">
              <Button
                size="icon-sm"
                variant="ghost-muted"
                aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${shortenAddress(section.safeAddress)}`}
                aria-expanded={!collapsed}
                aria-controls={chains.map((chain) => getChainSectionId(id, chain.chainId)).join(' ')}
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
              <SafeTitle section={section} />
              {collapsed && summary && (
                <span className="ml-auto truncate text-xs tabular-nums text-muted-foreground">{summary}</span>
              )}
            </div>
          </TableCell>
        </TableRow>
      </TableBody>

      {chains.map((chain) => (
        <ChainSection key={chain.chainId} safeAddress={section.safeAddress} chain={chain} hidden={collapsed} />
      ))}
    </>
  )
}

export default SafeSection
