/**
 * Safe Client Gateway API client for test setup and verification.
 *
 * Rule: Use API for precondition checks and data verification.
 * Reserve Playwright for what only a browser can test.
 */
import { CGW_BASE_URL, CHAIN_IDS } from '../data/constants'
import type { SafeInfo, BalancesResponse } from '../types/safe.types'
import type { CollectiblePage } from '@safe-global/store/gateway/AUTO_GENERATED/collectibles'
import type { DelegatesGetDelegatesV3ApiResponse } from '@safe-global/store/gateway/AUTO_GENERATED/delegates'
import type { Message } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import type {
  QueuedItemPage,
  Transaction,
  TransactionDetails,
  TransactionItemPage,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { transactionsIn } from './transaction-items'

const REQUEST_TIMEOUT_MS = 10_000
const RETRY_DELAY_MS = 1_000

async function apiError(response: Response): Promise<Error> {
  const body = await response.text().catch(() => '')
  return new Error(`API ${response.status}: ${response.statusText} — ${response.url}${body ? `\n${body}` : ''}`)
}

export class SafeApiClient {
  private baseUrl: string
  private chainId: string

  constructor(chainId: string = CHAIN_IDS.sepolia, baseUrl: string = CGW_BASE_URL) {
    this.baseUrl = baseUrl
    this.chainId = chainId
  }

  /**
   * GET request with timeout and single retry on 5xx / network errors; returns the last response.
   * 4xx responses return at once (real failures, not transient).
   */
  private async request(path: string, retries = 1): Promise<Response> {
    const url = `${this.baseUrl}${path}`
    for (let attempt = 0; ; attempt++) {
      const isLastAttempt = attempt >= retries
      try {
        const response = await fetch(url, {
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        })
        if (response.status < 500 || isLastAttempt) return response
      } catch (err) {
        if (isLastAttempt) throw err
      }
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
    }
  }

  private async get<T>(path: string, retries = 1): Promise<T> {
    const response = await this.request(path, retries)
    if (!response.ok) throw await apiError(response)
    return response.json() as Promise<T>
  }

  /** Get Safe info (owners, threshold, nonce, modules) */
  async getSafeInfo(safeAddress: string): Promise<SafeInfo> {
    return this.get<SafeInfo>(`/v1/chains/${this.chainId}/safes/${safeAddress}`)
  }

  /** Get the nonce of the next transaction of the Safe */
  async getNonce(safeAddress: string): Promise<number> {
    return (await this.getSafeInfo(safeAddress)).nonce
  }

  /** Get token balances for a Safe */
  async getBalances(safeAddress: string, currency = 'usd'): Promise<BalancesResponse> {
    return this.get<BalancesResponse>(`/v1/chains/${this.chainId}/safes/${safeAddress}/balances/${currency}`)
  }

  /** Get queued transactions */
  async getQueuedTransactions(safeAddress: string): Promise<QueuedItemPage> {
    return this.get(`/v1/chains/${this.chainId}/safes/${safeAddress}/transactions/queued`)
  }

  /** Get the queued transactions, without the labels and conflict headers of the queue page */
  async getQueued(safeAddress: string): Promise<Transaction[]> {
    return transactionsIn(await this.getQueuedTransactions(safeAddress))
  }

  /** Get the proposers (delegates) of a Safe from the Queue Service */
  async getDelegates(safeAddress: string): Promise<DelegatesGetDelegatesV3ApiResponse> {
    return this.get(`/v3/chains/${this.chainId}/delegates?safe=${safeAddress}`)
  }

  /** Get transaction history */
  async getTransactionHistory(safeAddress: string): Promise<TransactionItemPage> {
    return this.get(`/v1/chains/${this.chainId}/safes/${safeAddress}/transactions/history`)
  }

  /** Get a transaction by its ID (`multisig_<safe>_<safeTxHash>`); null when CGW does not know it */
  async findTransaction(txId: string): Promise<TransactionDetails | null> {
    const response = await this.request(`/v1/chains/${this.chainId}/transactions/${txId}`)
    if (response.status === 404) return null
    if (!response.ok) throw await apiError(response)
    return response.json() as Promise<TransactionDetails>
  }

  /** Get an off-chain message by its Safe message hash */
  async getMessage(messageHash: string): Promise<Message> {
    return this.get<Message>(`/v1/chains/${this.chainId}/messages/${messageHash}`)
  }

  /** Get collectibles (NFTs) */
  async getCollectibles(safeAddress: string): Promise<CollectiblePage> {
    return this.get(`/v2/chains/${this.chainId}/safes/${safeAddress}/collectibles`)
  }

  /** Get supported chains */
  async getChains(): Promise<unknown> {
    return this.get('/v1/chains')
  }
}
