import { useEffect, useState } from 'react'
import { useLazyTransactionsGetTransactionsHistoryV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { Transaction, TransactionItem, DateLabel } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { isSettingsChangeTxInfo } from '@/utils/transaction-guards'

export type AccountActivityWarning = {
  label: string
  severity: 'info' | 'warning' | 'error'
}

export type AccountActivityEntry = {
  id: string
  transaction: Transaction
  timestamp: number
  warnings: AccountActivityWarning[]
}

const MAX_PAGES = 10
const TARGET_ENTRIES = 20

const isTransactionItem = (item: TransactionItem | DateLabel): item is TransactionItem => item.type === 'TRANSACTION'

const extractCursor = (nextUrl?: string | null): string | undefined => {
  if (!nextUrl) return undefined
  try {
    const url = new URL(nextUrl)
    return url.searchParams.get('cursor') ?? undefined
  } catch {
    return undefined
  }
}

const HIGH_RISK_CHANGES = new Set(['CHANGE_MASTER_COPY', 'SET_GUARD', 'DELETE_GUARD', 'SET_FALLBACK_HANDLER'])

const deriveWarnings = (tx: Transaction): AccountActivityWarning[] => {
  const warnings: AccountActivityWarning[] = []

  if (tx.txStatus === 'FAILED') {
    warnings.push({ label: 'Execution failed', severity: 'error' })
  }

  if (tx.executionInfo?.type === 'MODULE') {
    warnings.push({ label: 'Module-executed', severity: 'warning' })
  }

  if (isSettingsChangeTxInfo(tx.txInfo)) {
    const changeType = tx.txInfo.settingsInfo.type
    if (HIGH_RISK_CHANGES.has(changeType)) {
      warnings.push({ label: 'Critical change', severity: 'warning' })
    }
  }

  return warnings
}

const extractSettingsChanges = (results: (TransactionItem | DateLabel)[]): AccountActivityEntry[] =>
  results
    .filter(isTransactionItem)
    .filter((item) => isSettingsChangeTxInfo(item.transaction.txInfo))
    .map((item) => ({
      id: item.transaction.id,
      transaction: item.transaction,
      timestamp: item.transaction.timestamp,
      warnings: deriveWarnings(item.transaction),
    }))

const useAccountActivity = (chainId: string, safeAddress: string) => {
  const [trigger] = useLazyTransactionsGetTransactionsHistoryV1Query()
  const [entries, setEntries] = useState<AccountActivityEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    if (!chainId || !safeAddress) return

    let cancelled = false

    const fetchPages = async () => {
      setIsLoading(true)
      setEntries([])
      setError(null)
      setHasMore(false)

      try {
        const collected: AccountActivityEntry[] = []
        let cursor: string | undefined
        let pages = 0
        let moreAvailable = false

        while (pages < MAX_PAGES) {
          const result = await trigger({ chainId, safeAddress, cursor })
          if (cancelled || !result.data?.results) break

          collected.push(...extractSettingsChanges(result.data.results))
          pages++

          const next = extractCursor(result.data.next)
          if (!next) break
          if (collected.length >= TARGET_ENTRIES) {
            moreAvailable = true
            break
          }
          cursor = next
        }

        // Hit page limit but more data exists
        if (pages >= MAX_PAGES) moreAvailable = true

        if (!cancelled) {
          setEntries(collected)
          setHasMore(moreAvailable)
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load account activity')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchPages()
    return () => {
      cancelled = true
    }
  }, [chainId, safeAddress, trigger])

  return { entries, isLoading, error, hasMore }
}

export default useAccountActivity
