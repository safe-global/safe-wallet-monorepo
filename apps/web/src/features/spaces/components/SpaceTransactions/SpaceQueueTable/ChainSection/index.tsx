import { useState, type ReactElement } from 'react'
import { TableBody } from '@safe-global/views/components/ui/table'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import SpaceQueueRow from '../../SpaceQueueRow'
import { getSafeKey, type QueueRowData, type QueueStatus } from '../../utils'
import ChainHeaderRow from '../ChainHeaderRow'
import ConflictHeaderRow from '../ConflictHeaderRow'

export type ChainRows = {
  chainId: string
  rows: QueueRowData[]
  statuses: Array<QueueStatus | undefined>
  nextNonce?: number
}

export const getChainSectionId = (safeKey: string, chainId: string): string => `space-queue-${safeKey}-${chainId}`

const ChainSection = ({
  safeAddress,
  chain: { chainId, rows, statuses, nextNonce },
  hidden,
}: {
  safeAddress: string
  chain: ChainRows
  hidden: boolean
}): ReactElement => {
  const [collapsed, setCollapsed] = useState(false)
  const id = getChainSectionId(getSafeKey(safeAddress), chainId)

  return (
    <SafeScopeProvider initial={{ chainId, safeAddress }} pollSafeInfo={false}>
      <TableBody hidden={hidden}>
        <ChainHeaderRow
          chainId={chainId}
          nextNonce={nextNonce}
          collapsed={collapsed}
          onToggle={() => setCollapsed((value) => !value)}
          controls={id}
        />
      </TableBody>
      <TableBody id={id} hidden={hidden || collapsed}>
        {rows.map((row, index) =>
          row.kind === 'conflict' ? (
            <ConflictHeaderRow key={`conflict-${row.nonce}-${index}`} nonce={row.nonce} size={row.size} />
          ) : (
            <SpaceQueueRow
              key={row.item.transaction.id}
              item={row.item}
              chainId={chainId}
              conflict={row.conflict}
              status={statuses[index] ?? 'waiting'}
              nextNonce={nextNonce}
            />
          ),
        )}
      </TableBody>
    </SafeScopeProvider>
  )
}

export default ChainSection
