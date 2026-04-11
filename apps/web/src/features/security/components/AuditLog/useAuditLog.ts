import { useEffect, useState } from 'react'
import { useLazyTransactionsGetTransactionsHistoryV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { Transaction, TransactionItem, DateLabel } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { isSettingsChangeTxInfo } from '@/utils/transaction-guards'

export type AuditLogEntry = {
  id: string
  transaction: Transaction
  timestamp: number
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

const extractSettingsChanges = (results: (TransactionItem | DateLabel)[]): AuditLogEntry[] =>
  results
    .filter(isTransactionItem)
    .filter((item) => isSettingsChangeTxInfo(item.transaction.txInfo))
    .map((item) => ({
      id: item.transaction.id,
      transaction: item.transaction,
      timestamp: item.transaction.timestamp,
    }))

const useAuditLog = (chainId: string, safeAddress: string) => {
  const [trigger] = useLazyTransactionsGetTransactionsHistoryV1Query()
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!chainId || !safeAddress) return

    let cancelled = false

    const fetchPages = async () => {
      setIsLoading(true)
      setEntries([])
      setError(null)

      try {
        const collected: AuditLogEntry[] = []
        let cursor: string | undefined
        let pages = 0

        while (pages < MAX_PAGES) {
          const result = await trigger({ chainId, safeAddress, cursor })
          if (cancelled || !result.data?.results) break

          collected.push(...extractSettingsChanges(result.data.results))
          pages++

          const next = extractCursor(result.data.next)
          if (!next || collected.length >= TARGET_ENTRIES) break
          cursor = next
        }

        if (!cancelled) {
          setEntries(collected)
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

  return { entries, isLoading, error }
}

export default useAuditLog
