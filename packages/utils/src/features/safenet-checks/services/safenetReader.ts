import { JsonRpcProvider } from 'ethers'
import { CONSENSUS_TOPIC0S } from '../abi'
import {
  GETLOGS_CHUNK_BLOCKS,
  MAX_LOOKBACK_BLOCKS,
  PROVIDER_BATCH_MAX_COUNT,
  SAFENET_CHAIN_ID,
  SAFENET_CONSENSUS_ADDRESS,
  SAFENET_RPC_URLS,
} from '../constants'
import type { Hex, NormalizedCheckEvent } from '../types'
import { decodeLogs, type RawLog } from '../utils/decodeLogs'

/**
 * Everything one poll reads off-chain for a single check, before the query layer
 * folds in FROST verification and the monotonic merge. Numeric values are decimal
 * strings so the result is Redux-serializable end-to-end.
 */
export type CheckReadResult = {
  safeTxHash: Hex
  /** The Safenet chain the Consensus contract lives on — the config chain id. */
  chainId: string
  /** All decoded lifecycle events, sorted ascending by (blockNumber, logIndex). */
  events: NormalizedCheckEvent[]
  /** Chain head observed at read time (a decimal string). */
  headBlock: string
}

export type SafenetReaderConfig = {
  /** Pinned Gnosis endpoints, rotated on failure. */
  rpcUrls: string[]
  /** Feeds the provider network; the EIP-712 request-id domain in later slices. */
  chainId: string
  consensus: string
}

/** Build a reader config from the dual-env constants (the production default). */
export const readerConfigFromEnv = (): SafenetReaderConfig => ({
  rpcUrls: SAFENET_RPC_URLS,
  chainId: SAFENET_CHAIN_ID,
  consensus: SAFENET_CONSENSUS_ADDRESS,
})

const IS_DEV = process.env.NODE_ENV !== 'production'

/** Inclusive [from, to] block ranges of at most `size` blocks each. */
const chunkRanges = (from: number, to: number, size: number): Array<[number, number]> => {
  const ranges: Array<[number, number]> = []
  for (let start = from; start <= to; start += size) {
    ranges.push([start, Math.min(start + size - 1, to)])
  }
  return ranges
}

/**
 * Chain reader for a check's Safenet lifecycle. Owns a pinned-endpoint provider,
 * rotated on failure. Construct with
 * {@link readerConfigFromEnv} in production; pass an explicit config in tests.
 */
export class SafenetReader {
  private readonly rpcUrls: string[]
  private readonly chainId: string
  private readonly consensus: string

  private urlIndex = 0
  private currentProvider: JsonRpcProvider | null = null
  private chainIdChecked = false

  constructor(config: SafenetReaderConfig) {
    this.rpcUrls = config.rpcUrls
    this.chainId = config.chainId
    this.consensus = config.consensus
  }

  private provider(): JsonRpcProvider {
    if (!this.currentProvider) {
      const url = this.rpcUrls[this.urlIndex]
      if (!url) throw new Error('Safenet reader: no RPC URLs configured (set SAFENET_RPC_URLS)')
      this.currentProvider = new JsonRpcProvider(url, Number(this.chainId), {
        staticNetwork: true,
        batchMaxCount: PROVIDER_BATCH_MAX_COUNT,
      })
    }
    return this.currentProvider
  }

  /**
   * Advance to the next endpoint — but only if `failed` is still the current
   * provider. Concurrent reads share the pinned provider; without this guard a
   * read cancelled by a sibling's rotation would rotate AGAIN, skipping over
   * (or cycling back to) endpoints and burning its retry budget on the same
   * dead URL.
   */
  private rotate(failed: JsonRpcProvider): void {
    if (this.currentProvider !== failed) return
    failed.destroy()
    this.currentProvider = null
    this.urlIndex = (this.urlIndex + 1) % this.rpcUrls.length
  }

  /** Run an op against the current endpoint, rotating through the URL list on failure. */
  private async withProvider<T>(op: (provider: JsonRpcProvider) => Promise<T>): Promise<T> {
    const attempts = Math.max(1, this.rpcUrls.length)
    let lastError: unknown
    for (let attempt = 0; attempt < attempts; attempt++) {
      const provider = this.provider()
      try {
        return await op(provider)
      } catch (error) {
        lastError = error
        this.rotate(provider)
      }
    }
    throw lastError
  }

  /** Dev-only, one-shot: warn loudly if the RPC's chain id disagrees with config. */
  private async assertChainId(provider: JsonRpcProvider): Promise<void> {
    if (this.chainIdChecked || !IS_DEV) return
    try {
      const actual = Number(await provider.send('eth_chainId', []))
      // One-shot only after a SUCCESSFUL probe — a dead first endpoint must not
      // consume the check before rotation reaches the endpoint actually used.
      this.chainIdChecked = true
      if (actual !== Number(this.chainId)) {
        console.error(
          `[safenet-reader] chain id mismatch: SAFENET_CHAIN_ID=${this.chainId} but the RPC ` +
            `reports ${actual}. Request ids derive from SAFENET_CHAIN_ID, so they will be WRONG ` +
            `and every check will appear stuck at SUBMITTED. Fix SAFENET_CHAIN_ID / SAFENET_RPC_URLS.`,
        )
      }
    } catch {
      // The assertion is a development aid, never a hard gate on the read path.
    }
  }

  private async getLogsChunked(
    provider: JsonRpcProvider,
    filter: { address?: string; topics: Array<string | string[]>; fromBlock: number; toBlock: number },
  ): Promise<RawLog[]> {
    const ranges = chunkRanges(filter.fromBlock, filter.toBlock, GETLOGS_CHUNK_BLOCKS)
    // Issued concurrently so the pinned provider coalesces them into one batched
    // HTTP request (bounded by PROVIDER_BATCH_MAX_COUNT).
    const chunks = await Promise.all(
      ranges.map(([fromBlock, toBlock]) =>
        provider.getLogs({ address: filter.address, topics: filter.topics, fromBlock, toBlock }),
      ),
    )
    // Onto the decoder's `RawLog` shape — ethers names the log index `.index`.
    return chunks.flat().map((log) => ({
      address: log.address,
      topics: [...log.topics],
      data: log.data,
      blockNumber: log.blockNumber,
      logIndex: log.index,
      transactionHash: log.transactionHash,
    }))
  }

  /**
   * Read a check's lifecycle: Consensus logs keyed by `safeTxHash` — both the
   * plain pair (all live beta emits) and the oracle-path Consensus events.
   * Returns the sorted event set; sentinel-oracle log correlation, FROST
   * verification, and the status machine live above this.
   */
  async fetchCheckState(safeTxHash: string): Promise<CheckReadResult> {
    // Validated up front: a malformed hash is a caller bug, not an endpoint
    // failure — it must not burn a rotation through the URL list.
    if (!/^0x[0-9a-f]{64}$/i.test(safeTxHash)) {
      throw new Error(`Safenet reader: invalid safeTxHash '${safeTxHash}'`)
    }
    return this.withProvider(async (provider) => {
      await this.assertChainId(provider)

      const latest = await provider.getBlock('latest')
      if (!latest) throw new Error('Safenet reader: could not read the chain head')
      const head = latest.number

      // Head-relative scan — sees the last MAX_LOOKBACK_BLOCKS (~42h on Gnosis).
      // Timestamp-aimed windows (constant cost at any age) arrive in the next slice.
      const range = { fromBlock: Math.max(0, head - MAX_LOOKBACK_BLOCKS + 1), toBlock: head }

      const consensusLogs = await this.getLogsChunked(provider, {
        address: this.consensus,
        topics: [[...CONSENSUS_TOPIC0S], safeTxHash],
        fromBlock: range.fromBlock,
        toBlock: range.toBlock,
      })
      const consensusEvents = decodeLogs(consensusLogs)

      // Ascending by (blockNumber, logIndex), so downstream folds see chain order.
      const events = [...consensusEvents].sort((a, b) => a.blockNumber - b.blockNumber || a.logIndex - b.logIndex)

      return {
        safeTxHash: safeTxHash as Hex,
        chainId: this.chainId,
        events,
        headBlock: head.toString(),
      }
    })
  }
}

let defaultReader: SafenetReader | null = null

/** The process-wide pinned-provider reader singleton (built from env constants). */
export const getSafenetReader = (): SafenetReader => (defaultReader ??= new SafenetReader(readerConfigFromEnv()))
