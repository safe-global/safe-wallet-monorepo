import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { SpaceQueueSection } from '../../../store/spaceQueueApi'
import {
  getNextNonce,
  getNonce,
  getQueueStatus,
  getRejectedNonces,
  getSafeKey,
  getSectionRows,
  type ConflictOption,
  type QueueStatus,
} from '../utils'

/** One table row of the queue, in display order */
export type QueueListItem =
  | { kind: 'safe'; key: string; section: SpaceQueueSection; collapsed: boolean; summary: string }
  | {
      kind: 'chain'
      key: string
      scopeKey: string
      safeAddress: string
      chainId: string
      nextNonce?: number
      collapsed: boolean
    }
  | {
      kind: 'conflict'
      key: string
      scopeKey: string
      safeAddress: string
      chainId: string
      nonce?: number
      size: number
    }
  | {
      kind: 'transaction'
      key: string
      scopeKey: string
      safeAddress: string
      chainId: string
      item: TransactionQueuedItem
      status: QueueStatus
      nextNonce?: number
      conflict?: ConflictOption
      canReject: boolean
    }

const SUMMARY_LABELS: Record<QueueStatus, string> = {
  execute: 'to execute',
  sign: 'to sign',
  waiting: 'waiting on others',
  blocked: 'blocked',
}
const SUMMARY_ORDER: QueueStatus[] = ['execute', 'sign', 'waiting', 'blocked']

export const getChainKey = (safeAddress: string, chainId: string): string => `${getSafeKey(safeAddress)}:${chainId}`

const getSummary = (statuses: QueueStatus[]): string =>
  SUMMARY_ORDER.flatMap((status) => {
    const count = statuses.filter((other) => other === status).length
    return count ? [`${count} ${SUMMARY_LABELS[status]}`] : []
  }).join(' · ')

/**
 * The queue flattened into the rows a virtualized table renders: a band per Safe, a header per chain,
 * a header per conflict group, and the transactions. Collapsed Safes and chains leave their rows out.
 */
export const buildQueueList = (args: {
  sections: SpaceQueueSection[]
  collapsedSafes: ReadonlySet<string>
  collapsedChains: ReadonlySet<string>
  walletAddress?: string
}): QueueListItem[] =>
  args.sections.flatMap((section) => {
    const safeKey = getSafeKey(section.safeAddress)
    const safeCollapsed = args.collapsedSafes.has(safeKey)
    const chains = section.chains.map(({ chainId, items }) => {
      const rows = getSectionRows(items)
      return {
        chainId,
        rows,
        nextNonce: getNextNonce(rows),
        rejectedNonces: getRejectedNonces(rows),
        statuses: rows.map((row) =>
          row.kind === 'transaction' ? getQueueStatus(row.item.transaction, row.isNext, args.walletAddress) : undefined,
        ),
      }
    })

    const band: QueueListItem = {
      kind: 'safe',
      key: `safe-${safeKey}`,
      section,
      collapsed: safeCollapsed,
      summary: getSummary(chains.flatMap((chain) => chain.statuses.filter((status) => status !== undefined))),
    }
    if (safeCollapsed) return [band]

    return [
      band,
      ...chains.flatMap(({ chainId, rows, nextNonce, rejectedNonces, statuses }) => {
        const scopeKey = getChainKey(section.safeAddress, chainId)
        const chainCollapsed = args.collapsedChains.has(scopeKey)
        const header: QueueListItem = {
          kind: 'chain',
          key: `chain-${scopeKey}`,
          scopeKey,
          safeAddress: section.safeAddress,
          chainId,
          nextNonce,
          collapsed: chainCollapsed,
        }
        if (chainCollapsed) return [header]

        return [
          header,
          ...rows.map<QueueListItem>((row, index) =>
            row.kind === 'conflict'
              ? {
                  kind: 'conflict',
                  key: `conflict-${scopeKey}-${row.nonce}-${index}`,
                  scopeKey,
                  safeAddress: section.safeAddress,
                  chainId,
                  nonce: row.nonce,
                  size: row.size,
                }
              : {
                  kind: 'transaction',
                  key: `tx-${row.item.transaction.id}`,
                  scopeKey,
                  safeAddress: section.safeAddress,
                  chainId,
                  item: row.item,
                  status: statuses[index] ?? 'waiting',
                  nextNonce,
                  conflict: row.conflict,
                  canReject: !rejectedNonces.has(getNonce(row.item.transaction) ?? -1),
                },
          ),
        ]
      }),
    ]
  })

/** Consecutive items sharing a Safe and chain, so one scope can wrap the visible rows of each. */
export const groupByScope = <T extends { item: QueueListItem }>(
  entries: T[],
): Array<{ scopeKey?: string; entries: T[] }> =>
  entries.reduce<Array<{ scopeKey?: string; entries: T[] }>>((groups, entry) => {
    const scopeKey = entry.item.kind === 'safe' ? undefined : entry.item.scopeKey
    const last = groups.at(-1)
    if (last && scopeKey !== undefined && last.scopeKey === scopeKey) {
      last.entries.push(entry)
    } else {
      groups.push({ scopeKey, entries: [entry] })
    }
    return groups
  }, [])
