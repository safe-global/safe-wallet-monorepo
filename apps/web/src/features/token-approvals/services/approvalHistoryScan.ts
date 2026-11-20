import { isError } from 'ethers'
import {
  cgwApi,
  type Transaction,
  type TransactionDetails,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import {
  extractApprovals,
  extractApprovalsFromEvents,
  hasOpaqueDelegateCall,
  isApprovalCandidate,
  mergeApprovalRecords,
  needsEventCheck,
  type ApprovalRecord,
  type RawLog,
} from '@safe-global/utils/features/token-approvals/approvalHistory'
import { getStoreInstance } from '@/store'

type Source = 'multisig' | 'module'

type ScannedHistory = {
  /** Newest transaction id per source when the last complete scan ran; paging stops there next time */
  newestIds: Partial<Record<Source, string>>
  records: ApprovalRecord[]
}

type ScanProgress = { scannedCount: number }

export type ScanOptions = {
  chainId: string
  safeAddress: string
  batchSize: number
  signal: AbortSignal
  /** The logs of a transaction's receipt, read from the chain's RPC */
  getTransactionLogs: (txHash: string) => Promise<RawLog[]>
  onProgress?: (progress: ScanProgress) => void
}

const DETAILS_CONCURRENCY = 4
const EVENTS_BATCH_SIZE = 50
const RETRY_DELAYS_MS = [1_000, 2_000, 4_000]

// Executed history never changes, so a later scan only needs what came after the last one
const scannedHistories = new Map<string, ScannedHistory>()

const getCacheKey = (chainId: string, safeAddress: string) => `${chainId}:${safeAddress.toLowerCase()}`

const toCursor = (batchSize: number, offset = 0) => `limit=${batchSize}&offset=${offset}`

const getNextCursor = (next: string | null | undefined): string | undefined =>
  next ? (new URL(next).searchParams.get('cursor') ?? undefined) : undefined

const isRetryable = (error: unknown): boolean => {
  if (isError(error, 'TIMEOUT') || isError(error, 'SERVER_ERROR') || isError(error, 'NETWORK_ERROR')) {
    return true
  }
  const status = (error as { status?: unknown } | undefined)?.status
  return (
    status === 429 ||
    status === 'FETCH_ERROR' ||
    status === 'TIMEOUT_ERROR' ||
    (typeof status === 'number' && status >= 500)
  )
}

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(resolve, ms)
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timeout)
        reject(signal.reason)
      },
      { once: true },
    )
  })

const withRetry = async <T>(request: () => Promise<T>, signal: AbortSignal): Promise<T> => {
  for (const delay of RETRY_DELAYS_MS) {
    try {
      return await request()
    } catch (error) {
      if (!isRetryable(error)) throw error
    }
    await wait(delay, signal)
  }
  return request()
}

const fetchPage = async (source: Source, chainId: string, safeAddress: string, cursor: string) => {
  const { dispatch } = getStoreInstance()
  const options = { subscribe: false, forceRefetch: true }
  const page =
    source === 'multisig'
      ? await dispatch(
          cgwApi.endpoints.transactionsGetMultisigTransactionsV1.initiate(
            { chainId, safeAddress, executed: true, cursor },
            options,
          ),
        ).unwrap()
      : await dispatch(
          cgwApi.endpoints.transactionsGetModuleTransactionsV1.initiate({ chainId, safeAddress, cursor }, options),
        ).unwrap()

  return {
    transactions: page.results.filter((item) => item.type === 'TRANSACTION').map((item) => item.transaction),
    nextCursor: getNextCursor(page.next),
  }
}

const fetchDetails = (chainId: string, tx: Transaction): Promise<TransactionDetails> =>
  getStoreInstance()
    .dispatch(cgwApi.endpoints.transactionsGetTransactionByIdV1.initiate({ chainId, id: tx.id }, { subscribe: false }))
    .unwrap()

const readEventApprovals = async (
  eventChecks: Map<string, Transaction>,
  { safeAddress, signal, getTransactionLogs }: ScanOptions,
): Promise<ApprovalRecord[]> => {
  const records: ApprovalRecord[] = []
  const checks = [...eventChecks]
  for (let i = 0; i < checks.length; i += EVENTS_BATCH_SIZE) {
    signal.throwIfAborted()
    const round = checks.slice(i, i + EVENTS_BATCH_SIZE)
    const logs = await Promise.all(round.map(([txHash]) => withRetry(() => getTransactionLogs(txHash), signal)))
    round.forEach(([txHash, tx], index) =>
      records.push(...extractApprovalsFromEvents(logs[index], safeAddress, { txHash, timestamp: tx.timestamp })),
    )
  }
  return records
}

const scanSource = async (
  source: Source,
  options: ScanOptions,
  stopAtId: string | undefined,
  progress: ScanProgress,
): Promise<{ records: ApprovalRecord[]; newestId: string | undefined }> => {
  const { chainId, safeAddress, batchSize, signal, onProgress } = options
  const records: ApprovalRecord[] = []
  let newestId: string | undefined
  let cursor: string | undefined = toCursor(batchSize)

  while (cursor) {
    signal.throwIfAborted()
    const pageCursor: string = cursor
    const page = await withRetry(() => fetchPage(source, chainId, safeAddress, pageCursor), signal)
    newestId ??= page.transactions[0]?.id

    const stopIndex = page.transactions.findIndex((tx) => tx.id === stopAtId)
    const unseen = stopIndex === -1 ? page.transactions : page.transactions.slice(0, stopIndex)
    const candidates = unseen.filter(isApprovalCandidate)
    // Keyed by tx hash: several module transactions can share one
    const eventChecks = new Map(
      unseen.filter((tx) => needsEventCheck(tx) && tx.txHash).map((tx) => [tx.txHash as string, tx]),
    )
    for (let i = 0; i < candidates.length; i += DETAILS_CONCURRENCY) {
      signal.throwIfAborted()
      const round = candidates.slice(i, i + DETAILS_CONCURRENCY)
      const details = await Promise.all(round.map((tx) => withRetry(() => fetchDetails(chainId, tx), signal)))
      details.forEach((txDetails, index) => {
        records.push(...extractApprovals(txDetails, round[index].timestamp))
        if (txDetails.txHash && hasOpaqueDelegateCall(txDetails)) eventChecks.set(txDetails.txHash, round[index])
      })
    }
    records.push(...(await readEventApprovals(eventChecks, options)))

    progress.scannedCount += unseen.length
    onProgress?.({ ...progress })

    cursor = stopIndex === -1 ? page.nextCursor : undefined
  }

  return { records, newestId: newestId ?? stopAtId }
}

// A completed scan is remembered for the session, so the next one only reads newer transactions
export const scanApprovalHistory = async (options: ScanOptions): Promise<ApprovalRecord[]> => {
  const { chainId, safeAddress, signal } = options
  const cacheKey = getCacheKey(chainId, safeAddress)
  const previous = scannedHistories.get(cacheKey)
  const progress: ScanProgress = { scannedCount: 0 }

  const multisig = await scanSource('multisig', options, previous?.newestIds.multisig, progress)
  const moduleTxs = await scanSource('module', options, previous?.newestIds.module, progress)
  signal.throwIfAborted()

  const records = mergeApprovalRecords([...(previous?.records ?? []), ...multisig.records, ...moduleTxs.records])
  scannedHistories.set(cacheKey, {
    newestIds: { multisig: multisig.newestId, module: moduleTxs.newestId },
    records,
  })
  return records
}

export const clearScannedHistories = (): void => scannedHistories.clear()
