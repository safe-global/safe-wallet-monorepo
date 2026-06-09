/**
 * Safe Client Gateway API client for test setup and verification.
 *
 * Rule: Use API for precondition checks and data verification.
 * Reserve Playwright for what only a browser can test.
 */
import { CGW_BASE_URL, CHAIN_IDS } from '../data/constants'
import type { SafeInfo, BalancesResponse } from '../types/safe.types'

const REQUEST_TIMEOUT_MS = 10_000
const RETRY_DELAY_MS = 1_000

export class SafeApiClient {
  private baseUrl: string
  private chainId: string

  constructor(chainId: string = CHAIN_IDS.sepolia, baseUrl: string = CGW_BASE_URL) {
    this.baseUrl = baseUrl
    this.chainId = chainId
  }

  /**
   * GET request with timeout and single retry on 5xx / network errors.
   * - 4xx errors fail immediately (real failures, not transient)
   * - 5xx errors retry once after 1s delay
   * - Network errors (timeout, DNS, connection refused) retry once
   */
  private async get<T>(path: string, retries = 1): Promise<T> {
    const url = `${this.baseUrl}${path}`
    let lastError: Error | undefined

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        })

        if (response.ok) {
          return response.json() as Promise<T>
        }

        // 5xx — retry if attempts remain
        if (response.status >= 500 && attempt < retries) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
          continue
        }

        // 4xx or final 5xx attempt — fail with response body for debugging
        const body = await response.text().catch(() => '')
        throw new Error(`API ${response.status}: ${response.statusText} — ${url}${body ? `\n${body}` : ''}`)
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))

        // Network error or timeout — retry if attempts remain
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
          continue
        }
      }
    }

    throw lastError ?? new Error(`API request failed after ${retries + 1} attempts: ${path}`)
  }

  /** Get Safe info (owners, threshold, nonce, modules) */
  async getSafeInfo(safeAddress: string): Promise<SafeInfo> {
    return this.get<SafeInfo>(`/v1/chains/${this.chainId}/safes/${safeAddress}`)
  }

  /** Get token balances for a Safe */
  async getBalances(safeAddress: string, currency = 'usd'): Promise<BalancesResponse> {
    return this.get<BalancesResponse>(`/v1/chains/${this.chainId}/safes/${safeAddress}/balances/${currency}`)
  }

  /** Get queued transactions */
  async getQueuedTransactions(safeAddress: string): Promise<unknown> {
    return this.get(`/v1/chains/${this.chainId}/safes/${safeAddress}/transactions/queued`)
  }

  /** Get transaction history */
  async getTransactionHistory(safeAddress: string): Promise<unknown> {
    return this.get(`/v1/chains/${this.chainId}/safes/${safeAddress}/transactions/history`)
  }

  /** Get collectibles (NFTs) */
  async getCollectibles(safeAddress: string): Promise<unknown> {
    return this.get(`/v2/chains/${this.chainId}/safes/${safeAddress}/collectibles`)
  }

  /** Get supported chains */
  async getChains(): Promise<unknown> {
    return this.get('/v1/chains')
  }

  /** Health check — is the CGW reachable? */
  async isHealthy(): Promise<boolean> {
    try {
      await this.get('/health/ready', 0) // No retry on health check
      return true
    } catch {
      return false
    }
  }
}
