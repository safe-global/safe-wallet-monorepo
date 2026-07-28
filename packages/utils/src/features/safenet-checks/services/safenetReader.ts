import { Contract, JsonRpcProvider, type Log } from 'ethers'
import { CONSENSUS_READ_ABI, CONSENSUS_TOPIC0S, COORDINATOR_READ_ABI, SENTINEL_TOPIC0S } from '../abi'
import {
  BLOCK_ESTIMATE_MAX_REFINEMENTS,
  BLOCK_ESTIMATE_TOLERANCE_SECONDS,
  BLOCK_TIME_SECONDS,
  GETLOGS_CHUNK_BLOCKS,
  MAX_LOOKBACK_BLOCKS,
  PROVIDER_BATCH_MAX_COUNT,
  SAFENET_CHAIN_ID,
  SAFENET_CONSENSUS_ADDRESS,
  SAFENET_COORDINATOR_ADDRESS,
  SAFENET_ORACLE_ADDRESSES,
  SAFENET_RPC_URLS,
  TARGETED_WINDOW_HALF_BLOCKS,
} from '../constants'
import {
  AttestationVerificationStatus,
  CheckEventType,
  OracleGeneration,
  type AttestationVerification,
  type Hex,
  type NormalizedCheckEvent,
  type OracleAttestedEvent,
  type PlainAttestedEvent,
  type OracleProposedEvent,
} from '../types'
import { decodeLogs, oracleProposalHash, plainProposalHash, type RawLog } from '../utils'
import { verifyAttestation as verifyFrostAttestation } from '../utils/frost'

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
  /** The oracle generation that drove this check, once a sentinel event is seen. */
  generation: OracleGeneration | null
  /** The oracle request id (equals the oracle-proposal hash), once proposed. */
  requestId: Hex | null
  epoch: string | null
  oracle: string | null
  /** Block the check times out at (V1 `deadline` / V2 `revealDeadline`). */
  deadlineBlock: string | null
}

export type SafenetReaderConfig = {
  /** Pinned Gnosis endpoints, rotated on failure. */
  rpcUrls: string[]
  /** Feeds BOTH the provider network AND the EIP-712 request-id domain. */
  chainId: string
  consensus: string
  /** FROSTCoordinator override; `null` discovers it via `getCoordinator()`. */
  coordinator: string | null
  /** Allowlisted sentinel-oracle addresses. Empty = the oracle path is skipped. */
  oracles: string[]
}

/** Build a reader config from the dual-env constants (the production default). */
export const readerConfigFromEnv = (): SafenetReaderConfig => ({
  rpcUrls: SAFENET_RPC_URLS,
  chainId: SAFENET_CHAIN_ID,
  consensus: SAFENET_CONSENSUS_ADDRESS,
  coordinator: SAFENET_COORDINATOR_ADDRESS,
  oracles: SAFENET_ORACLE_ADDRESSES,
})

const IS_DEV = process.env.NODE_ENV !== 'production'

const isProposed = (event: NormalizedCheckEvent): event is OracleProposedEvent =>
  event.type === CheckEventType.ORACLE_PROPOSED

/** Sort a copy of the events ascending by (blockNumber, logIndex). */
const sortEvents = (events: NormalizedCheckEvent[]): NormalizedCheckEvent[] =>
  [...events].sort((a, b) => a.blockNumber - b.blockNumber || a.logIndex - b.logIndex)

/** Inclusive [from, to] block ranges of at most `size` blocks each. */
const chunkRanges = (from: number, to: number, size: number): Array<[number, number]> => {
  const ranges: Array<[number, number]> = []
  for (let start = from; start <= to; start += size) {
    ranges.push([start, Math.min(start + size - 1, to)])
  }
  return ranges
}

/** Map an ethers `Log` onto the decoder's `RawLog` shape (`.index` → `logIndex`). */
const toRawLog = (log: Log): RawLog => ({
  address: log.address,
  topics: [...log.topics],
  data: log.data,
  blockNumber: log.blockNumber,
  logIndex: log.index,
  transactionHash: log.transactionHash,
})

/** Highest `deadlineBlock` across the check's request events, as a string or null. */
const maxDeadline = (events: NormalizedCheckEvent[]): string | null => {
  let max: bigint | null = null
  for (const event of events) {
    if (event.type === CheckEventType.REQUEST_CREATED) {
      const value = BigInt(event.deadlineBlock)
      if (max === null || value > max) max = value
    }
  }
  return max === null ? null : max.toString()
}

/**
 * Chain reader for a check's Safenet lifecycle. Owns a pinned-endpoint provider
 * (rotated on failure), a per-epoch group-key cache, and a per-signature
 * verification cache. Construct with {@link readerConfigFromEnv} in production;
 * pass an explicit config in tests.
 */
export class SafenetReader {
  private readonly rpcUrls: string[]
  private readonly chainId: string
  private readonly consensus: string
  private readonly coordinator: string | null
  private readonly oracles: readonly string[]

  private urlIndex = 0
  private currentProvider: JsonRpcProvider | null = null
  private chainIdChecked = false
  private coordinatorPromise: Promise<string> | null = null
  private readonly groupKeyCache = new Map<string, { x: string; y: string }>()
  private readonly verificationCache = new Map<string, AttestationVerification>()

  constructor(config: SafenetReaderConfig) {
    this.rpcUrls = config.rpcUrls
    this.chainId = config.chainId
    this.consensus = config.consensus
    this.coordinator = config.coordinator
    this.oracles = config.oracles.map((address) => address.toLowerCase())
  }

  /** True when an oracle address is on the configured allowlist. */
  private isAllowedOracle(oracle: string): boolean {
    return this.oracles.includes(oracle.toLowerCase())
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

  private rotate(): void {
    this.currentProvider?.destroy()
    this.currentProvider = null
    if (this.rpcUrls.length > 0) this.urlIndex = (this.urlIndex + 1) % this.rpcUrls.length
  }

  /** Run an op against the current endpoint, rotating through the URL list on failure. */
  private async withProvider<T>(op: (provider: JsonRpcProvider) => Promise<T>): Promise<T> {
    const attempts = Math.max(1, this.rpcUrls.length)
    let lastError: unknown
    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        return await op(this.provider())
      } catch (error) {
        lastError = error
        this.rotate()
      }
    }
    throw lastError
  }

  /** Dev-only, one-shot: warn loudly if the RPC's chain id disagrees with config. */
  private async assertChainId(provider: JsonRpcProvider): Promise<void> {
    if (this.chainIdChecked || !IS_DEV) return
    this.chainIdChecked = true
    try {
      const actual = Number(await provider.send('eth_chainId', []))
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
    return chunks.flat().map(toRawLog)
  }

  /**
   * Choose the block range to read.
   *
   * With a transaction timestamp: a narrow window centred on the matching block,
   * so a two-year-old check costs the same as a two-minute-old one. Without one:
   * the head-relative scan, which only sees the last {@link MAX_LOOKBACK_BLOCKS}.
   */
  private async readRange(
    provider: JsonRpcProvider,
    timestampMs: number | null | undefined,
    head: { number: number; timestamp: number },
  ): Promise<{ fromBlock: number; toBlock: number }> {
    if (timestampMs == null || !Number.isFinite(timestampMs)) {
      return { fromBlock: Math.max(0, head.number - MAX_LOOKBACK_BLOCKS + 1), toBlock: head.number }
    }
    const centre = await this.estimateBlockAt(provider, Math.floor(timestampMs / 1000), head)
    // Exactly one chunk wide, so a targeted read is always a single getLogs.
    const fromBlock = Math.max(0, centre - TARGETED_WINDOW_HALF_BLOCKS)
    return { fromBlock, toBlock: Math.min(head.number, fromBlock + GETLOGS_CHUNK_BLOCKS - 1) }
  }

  /**
   * Estimate the block nearest a unix timestamp, using the nominal block time and
   * refining against real block timestamps to absorb drift.
   *
   * Costs one RPC call per refinement round (at most
   * {@link BLOCK_ESTIMATE_MAX_REFINEMENTS}), and stops early once within
   * {@link BLOCK_ESTIMATE_TOLERANCE_SECONDS}.
   */
  private async estimateBlockAt(
    provider: JsonRpcProvider,
    targetSeconds: number,
    head: { number: number; timestamp: number },
  ): Promise<number> {
    const clamp = (block: number) => Math.min(head.number, Math.max(0, block))
    let guess = clamp(head.number - Math.floor((head.timestamp - targetSeconds) / BLOCK_TIME_SECONDS))

    for (let round = 0; round < BLOCK_ESTIMATE_MAX_REFINEMENTS; round++) {
      const block = await provider.getBlock(guess)
      if (!block) break
      const drift = block.timestamp - targetSeconds
      if (Math.abs(drift) <= BLOCK_ESTIMATE_TOLERANCE_SECONDS) break
      const next = clamp(guess - Math.round(drift / BLOCK_TIME_SECONDS))
      if (next === guess) break
      guess = next
    }
    return guess
  }

  /**
   * Read a check's full lifecycle: Consensus logs keyed by `safeTxHash`, then —
   * once a `Proposed` event pins the epoch/oracle — the sentinel/oracle logs keyed
   * by the derived `requestId`. Returns the sorted event set plus the derived
   * correlation fields; FROST verification and the status machine live above this.
   *
   * @param safeTxHash - the Safe transaction hash to read.
   * @param options.timestampMs - when the Safe transaction happened. Given this,
   *   the read targets a narrow window around the matching block instead of
   *   walking back {@link MAX_LOOKBACK_BLOCKS} from the head, so cost stays
   *   constant however old the check is. Falls back to the head-relative scan
   *   when omitted.
   */
  async fetchCheckState(safeTxHash: string, options: { timestampMs?: number | null } = {}): Promise<CheckReadResult> {
    return this.withProvider(async (provider) => {
      await this.assertChainId(provider)

      const latest = await provider.getBlock('latest')
      if (!latest) throw new Error('Safenet reader: could not read the chain head')
      const head = latest.number

      const range = await this.readRange(provider, options.timestampMs, {
        number: head,
        timestamp: latest.timestamp,
      })

      const consensusLogs = await this.getLogsChunked(provider, {
        address: this.consensus,
        topics: [[...CONSENSUS_TOPIC0S], safeTxHash],
        fromBlock: range.fromBlock,
        toBlock: range.toBlock,
      })
      const consensusEvents = decodeLogs(consensusLogs)

      // Only a proposal naming an ALLOWLISTED oracle may drive the oracle read.
      // `proposeOracleTransaction` is permissionless and the oracle address is a
      // caller argument, so an unfiltered `find` would let anyone point us at
      // their own contract and feed us a fabricated `OracleResult`.
      const proposed = consensusEvents.find(
        (event): event is OracleProposedEvent => isProposed(event) && this.isAllowedOracle(event.oracle),
      )

      let requestId: Hex | null = null
      let oracleEvents: NormalizedCheckEvent[] = []
      if (proposed) {
        requestId = oracleProposalHash({
          chainId: this.chainId,
          consensus: this.consensus,
          epoch: proposed.epoch,
          oracle: proposed.oracle,
          safeTxHash: safeTxHash as Hex,
        })
        const oracleLogs = await this.getLogsChunked(provider, {
          address: proposed.oracle,
          topics: [[...SENTINEL_TOPIC0S], requestId],
          fromBlock: range.fromBlock,
          toBlock: range.toBlock,
        })
        oracleEvents = decodeLogs(oracleLogs)
      }

      const events = sortEvents([...consensusEvents, ...oracleEvents])
      const generation = events.find((event) => event.generation !== OracleGeneration.STABLE)?.generation ?? null

      return {
        safeTxHash: safeTxHash as Hex,
        chainId: this.chainId,
        events,
        headBlock: head.toString(),
        generation,
        requestId,
        epoch: proposed?.epoch ?? null,
        oracle: proposed?.oracle ?? null,
        deadlineBlock: maxDeadline(events),
      }
    })
  }

  private async resolveCoordinator(provider: JsonRpcProvider): Promise<string> {
    if (this.coordinator) return this.coordinator
    if (!this.coordinatorPromise) {
      const consensus = new Contract(this.consensus, [...CONSENSUS_READ_ABI], provider)
      this.coordinatorPromise = (consensus.getCoordinator() as Promise<string>).catch((error) => {
        // Never cache a failed discovery — the next call retries.
        this.coordinatorPromise = null
        throw error
      })
    }
    return this.coordinatorPromise
  }

  /**
   * Resolve an epoch's FROST group public key: `getEpochGroupId(epoch)` →
   * `coordinator.groupKey(groupId)`. Cached by group id. Throws on RPC failure so
   * {@link verifyAttestation} can treat it as retryable (`PENDING`).
   */
  async loadGroupKey(epoch: string): Promise<{ x: string; y: string }> {
    return this.withProvider(async (provider) => {
      const consensus = new Contract(this.consensus, [...CONSENSUS_READ_ABI], provider)
      const groupId: string = await consensus.getEpochGroupId(BigInt(epoch))

      const cached = this.groupKeyCache.get(groupId)
      if (cached) return cached

      const coordinatorAddress = await this.resolveCoordinator(provider)
      const coordinator = new Contract(coordinatorAddress, [...COORDINATOR_READ_ABI], provider)
      const key = await coordinator.groupKey(groupId)
      const point = { x: key.x.toString(), y: key.y.toString() }
      this.groupKeyCache.set(groupId, point)
      return point
    })
  }

  /**
   * Verify an attested event's FROST signature against its epoch group key.
   * Cached (terminal outcomes only) by `signatureId`. A group-key fetch failure is
   * retryable (`PENDING`, not cached); a signature that does not verify is terminal
   * (`INVALID`) and must never render as BENIGN.
   */
  async verifyAttestation(attested: OracleAttestedEvent | PlainAttestedEvent): Promise<AttestationVerification> {
    // The two paths sign different EIP-712 preimages. Deriving it here, from the
    // event we actually decoded, is the only place that knows which is which —
    // callers cannot pair the wrong hash with the wrong attestation.
    const message =
      attested.type === CheckEventType.ORACLE_ATTESTED
        ? oracleProposalHash({
            chainId: this.chainId,
            consensus: this.consensus,
            epoch: attested.epoch,
            oracle: attested.oracle,
            safeTxHash: attested.safeTxHash,
          })
        : plainProposalHash({
            chainId: this.chainId,
            consensus: this.consensus,
            epoch: attested.epoch,
            safeTxHash: attested.safeTxHash,
          })

    const signatureId = attested.signatureId
    const cached = this.verificationCache.get(signatureId)
    if (cached) return cached

    let groupKey: { x: string; y: string }
    try {
      groupKey = await this.loadGroupKey(attested.epoch)
    } catch {
      return { status: AttestationVerificationStatus.PENDING, signatureId, message }
    }

    const verified = verifyFrostAttestation({ groupKey, attestation: attested.attestation, message })
    const result: AttestationVerification = {
      status: verified ? AttestationVerificationStatus.VERIFIED : AttestationVerificationStatus.INVALID,
      signatureId,
      message,
    }
    this.verificationCache.set(signatureId, result)
    return result
  }
}

let defaultReader: SafenetReader | null = null

/** The process-wide pinned-provider reader singleton (built from env constants). */
export const getSafenetReader = (): SafenetReader => (defaultReader ??= new SafenetReader(readerConfigFromEnv()))

/** Drop the singleton so the next {@link getSafenetReader} rebuilds it (tests). */
export const resetSafenetReader = (): void => {
  defaultReader = null
}
