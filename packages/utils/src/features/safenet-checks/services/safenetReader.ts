import { Contract, isCallException, JsonRpcProvider } from 'ethers'
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
  TARGETED_WINDOW_BACK_BLOCKS,
} from '../constants'
import {
  AttestationVerificationStatus,
  CheckEventType,
  OracleGeneration,
  type AttestationVerification,
  type Hex,
  type NormalizedCheckEvent,
  type OracleAttestedEvent,
  type OracleProposedEvent,
  type PlainAttestedEvent,
} from '../types'
import { decodeLogs, type RawLog } from '../utils/decodeLogs'
import { deadlineBlockOf } from '../utils/deriveCheckState'
import { isValidPoint, verifyAttestation as verifyFrostAttestation } from '../utils/frost'
import { oracleProposalHash, plainProposalHash } from '../utils/oracleProposalHash'

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
  /**
   * The oracle generation that drove the active request, once a sentinel event
   * for it is seen. `null` means no sentinel event has landed yet. It does not
   * mean the check is generation-agnostic; a Consensus-only lifecycle never
   * populates this field.
   */
  generation: OracleGeneration | null
  /**
   * Correlation metadata from the latest allowlisted proposal.
   *
   * Proposals are permissionless, so an attacker can propose the victim's
   * transaction to an allowlisted oracle and become the proposal these fields
   * describe. Do not render them as provenance.
   *
   * They still affect the read. `requestId` selects which sentinel logs are
   * fetched, and those feed the verdict. `deadlineBlock` is the maximum across
   * requests, so a third-party request can push it out and suppress TIMED_OUT.
   */
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
  /** FROSTCoordinator the epoch group keys are read from. */
  coordinator: string
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

/**
 * Cap on distinct requestIds per oracle in one sentinel getLogs topic filter.
 *
 * `epoch` comes from `epochs.active` inside the contract, not from the caller,
 * so every proposal of the same check to the same oracle within one epoch
 * derives the same id and collapses at the dedupe below. The number of distinct
 * ids is bounded by epoch rollovers inside the read window, normally one or two.
 * This cap is a backstop against the OR-filter growing past RPC limits. The
 * newest ids are the ones kept.
 */
const MAX_REQUEST_IDS_PER_ORACLE = 16

/** Inclusive [from, to] block ranges of at most `size` blocks each. */
const chunkRanges = (from: number, to: number, size: number): Array<[number, number]> => {
  const ranges: Array<[number, number]> = []
  for (let start = from; start <= to; start += size) {
    ranges.push([start, Math.min(start + size - 1, to)])
  }
  return ranges
}

/**
 * Chain reader for a check's Safenet lifecycle. Owns a pinned-endpoint provider
 * (rotated on failure) and a per-epoch FROST group-key cache. Construct with
 * {@link readerConfigFromEnv} in production; pass an explicit config in tests.
 */
export class SafenetReader {
  private readonly rpcUrls: string[]
  private readonly chainId: string
  private readonly consensus: string
  private readonly coordinator: string
  private readonly oracles: readonly string[]

  private urlIndex = 0
  private currentProvider: JsonRpcProvider | null = null
  private chainIdChecked = false
  /** Epoch → FROST group public key. The binding is immutable once staged. */
  private readonly groupKeyCache = new Map<string, { x: string; y: string }>()

  constructor(config: SafenetReaderConfig) {
    this.rpcUrls = config.rpcUrls
    this.chainId = config.chainId
    this.consensus = config.consensus
    this.coordinator = config.coordinator
    this.oracles = config.oracles.map((address) => address.toLowerCase())
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
        // A deterministic contract revert (e.g. `groupKey` for an epoch the
        // coordinator has not seen) is not an endpoint failure. Rotating and
        // retrying every URL would repeat it N times and tear down the shared
        // provider under concurrent reads. Only revert DATA proves a revert,
        // though: ethers turns every JSON-RPC error on an eth_call into a
        // CALL_EXCEPTION, so a data-less one may just be a rate limit or pruned
        // state on this endpoint, and the next endpoint deserves a try.
        if (isCallException(error) && error.data != null) throw error
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
   * Choose the block range to read.
   *
   * Given a transaction timestamp, this is a narrow window around the matching
   * block, so a two-year-old check costs the same as a two-minute-old one.
   * Without a timestamp, or when the block estimate did not converge, it is the
   * head-relative scan, which only sees the last {@link MAX_LOOKBACK_BLOCKS}.
   *
   * Known limit: the targeted window ends about 12.5h after the transaction. A
   * settlement that lands later, such as a long arbitration, falls outside every
   * aimed re-read of an old check. The check then reads TIMED_OUT rather than
   * reporting a BENIGN it cannot support.
   */
  private async readRange(
    provider: JsonRpcProvider,
    timestampMs: number | null | undefined,
    head: { number: number; timestamp: number },
  ): Promise<{ fromBlock: number; toBlock: number }> {
    const headRelative = { fromBlock: Math.max(0, head.number - MAX_LOOKBACK_BLOCKS + 1), toBlock: head.number }
    if (timestampMs == null || !Number.isFinite(timestampMs)) return headRelative

    const targetSeconds = Math.floor(timestampMs / 1000)
    const { block: centre, driftSeconds } = await this.estimateBlockAt(provider, targetSeconds, head)
    // Aim the window only when the estimate converged. Turning a leftover drift
    // into a block budget needs the cadence near the target, which nothing here
    // measures. Over a stretch faster than nominal, a cadence-derived budget
    // under-counts the error and the window misses the events with no error
    // raised. A target at or past the head is the exception: the estimate is
    // pinned to the head, which is the correct aim however stale the clock is.
    if (targetSeconds < head.timestamp && Math.abs(driftSeconds) > BLOCK_ESTIMATE_TOLERANCE_SECONDS) {
      return headRelative
    }

    // One chunk wide, so a targeted read is always a single getLogs. Weighted
    // forward: see TARGETED_WINDOW_BACK_BLOCKS.
    const fromBlock = Math.max(0, centre - TARGETED_WINDOW_BACK_BLOCKS)
    return { fromBlock, toBlock: Math.min(head.number, fromBlock + GETLOGS_CHUNK_BLOCKS - 1) }
  }

  /**
   * Estimate the block nearest a unix timestamp, and report how far off the
   * estimate still is.
   *
   * The nominal {@link BLOCK_TIME_SECONDS} only seeds the first guess. Each
   * refinement uses the block time observed between the probe and the head, so
   * the estimate converges even when the chain's real cadence drifts from the
   * nominal value. Costs one RPC call per probe (at most
   * {@link BLOCK_ESTIMATE_MAX_REFINEMENTS} + 1), and stops early once within
   * {@link BLOCK_ESTIMATE_TOLERANCE_SECONDS}.
   *
   * `driftSeconds` is measured at the returned (probed) block, and is `Infinity`
   * when no probe succeeded, so callers can tell a converged estimate from a
   * guess.
   */
  private async estimateBlockAt(
    provider: JsonRpcProvider,
    targetSeconds: number,
    head: { number: number; timestamp: number },
  ): Promise<{ block: number; driftSeconds: number }> {
    const clamp = (block: number) => Math.min(head.number, Math.max(0, block))
    let guess = clamp(head.number - Math.floor((head.timestamp - targetSeconds) / BLOCK_TIME_SECONDS))
    let best = { block: guess, driftSeconds: Number.POSITIVE_INFINITY }

    for (let probe = 0; probe <= BLOCK_ESTIMATE_MAX_REFINEMENTS; probe++) {
      // A failed probe degrades the read, it does not fail it. An endpoint that
      // cannot serve an old header (`missing trie node` is common on
      // load-balanced public RPC) falls back to the head-relative scan, and does
      // not consume a rotation on an otherwise healthy endpoint.
      const block = await provider.getBlock(guess).catch(() => null)
      if (!block) break
      const driftSeconds = block.timestamp - targetSeconds
      const span = head.number - guess
      // Floored: a run of equal timestamps must not divide by zero below.
      const observedBlockTime = span > 0 ? Math.max((head.timestamp - block.timestamp) / span, 0.1) : BLOCK_TIME_SECONDS
      if (Math.abs(driftSeconds) < Math.abs(best.driftSeconds)) best = { block: guess, driftSeconds }
      if (Math.abs(driftSeconds) <= BLOCK_ESTIMATE_TOLERANCE_SECONDS) break
      const next = clamp(guess - Math.round(driftSeconds / observedBlockTime))
      if (next === guess) break
      guess = next
    }
    return best
  }

  /**
   * Read a check's full lifecycle: Consensus logs keyed by `safeTxHash`, then —
   * for every proposal naming an allowlisted oracle — the sentinel/oracle logs
   * keyed by the derived `requestId`s. Returns the sorted event set plus the
   * derived correlation fields; FROST verification and the status machine live
   * above this.
   *
   * @param safeTxHash - the Safe transaction hash to read.
   * @param options.timestampMs - when the Safe transaction happened. Given this,
   *   the read targets a narrow window around the matching block instead of
   *   walking back {@link MAX_LOOKBACK_BLOCKS} from the head, so cost stays
   *   constant however old the check is. Falls back to the head-relative scan
   *   when omitted.
   */
  async fetchCheckState(safeTxHash: string, options: { timestampMs?: number | null } = {}): Promise<CheckReadResult> {
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
      // Sorted here as well as on the combined set below. The requestId cap
      // relies on chain order, and `eth_getLogs` ordering is a node convention
      // with no guarantee behind it.
      const consensusEvents = decodeLogs(consensusLogs).sort(
        (a, b) => a.blockNumber - b.blockNumber || a.logIndex - b.logIndex,
      )

      // Only proposals naming an allowlisted oracle may drive the oracle read.
      // `proposeOracleTransaction` is permissionless and the oracle address is a
      // caller argument, so an unfiltered read would let anyone point us at
      // their own contract and feed us a fabricated `OracleResult`. Every such
      // proposal is read, including later ones: a check can be re-proposed in a
      // later epoch, and each epoch derives a distinct requestId.
      const proposals = consensusEvents.filter(
        (event): event is OracleProposedEvent => isProposed(event) && this.oracles.includes(event.oracle.toLowerCase()),
      )

      const requestIdsByOracle = new Map<string, Hex[]>()
      for (const proposal of proposals) {
        const id = oracleProposalHash({
          chainId: this.chainId,
          consensus: this.consensus,
          epoch: proposal.epoch,
          oracle: proposal.oracle,
          safeTxHash: safeTxHash as Hex,
        })
        // Keyed by the normalized address so one oracle cannot occupy two
        // buckets, and issue two getLogs, if a decoder changes its casing.
        const key = proposal.oracle.toLowerCase()
        const ids = requestIdsByOracle.get(key) ?? []
        if (!ids.includes(id)) requestIdsByOracle.set(key, [...ids, id].slice(-MAX_REQUEST_IDS_PER_ORACLE))
      }

      const oracleEvents: NormalizedCheckEvent[] = []
      for (const [oracle, requestIds] of requestIdsByOracle) {
        const oracleLogs = await this.getLogsChunked(provider, {
          address: oracle,
          topics: [[...SENTINEL_TOPIC0S], requestIds],
          fromBlock: range.fromBlock,
          toBlock: range.toBlock,
        })
        oracleEvents.push(...decodeLogs(oracleLogs))
      }

      // The latest allowlisted proposal is the live one. Its requestId is the
      // correlation the sentinel is answering, or will answer.
      const active = proposals.reduce<OracleProposedEvent | null>(
        (latest, event) =>
          latest === null ||
          event.blockNumber > latest.blockNumber ||
          (event.blockNumber === latest.blockNumber && event.logIndex > latest.logIndex)
            ? event
            : latest,
        null,
      )
      const requestId: Hex | null = active
        ? oracleProposalHash({
            chainId: this.chainId,
            consensus: this.consensus,
            epoch: active.epoch,
            oracle: active.oracle,
            safeTxHash: safeTxHash as Hex,
          })
        : null

      // Ascending by (blockNumber, logIndex), so downstream folds see chain order.
      const events = [...consensusEvents, ...oracleEvents].sort(
        (a, b) => a.blockNumber - b.blockNumber || a.logIndex - b.logIndex,
      )
      // Scoped to the active request. A check re-proposed across generations
      // would otherwise report the first generation seen alongside the latest
      // request's id, describing two different requests at once.
      const generation =
        events.find(
          (event) =>
            event.generation !== OracleGeneration.STABLE && 'requestId' in event && event.requestId === requestId,
        )?.generation ?? null
      // The maximum across all requests, not the active request's. After a
      // cross-epoch re-proposal the latest deadline belongs to the request that
      // can still resolve, while `requestId` names the latest proposal.
      const deadline = deadlineBlockOf(events)

      return {
        safeTxHash: safeTxHash as Hex,
        chainId: this.chainId,
        events,
        headBlock: head.toString(),
        generation,
        requestId,
        epoch: active?.epoch ?? null,
        oracle: active?.oracle ?? null,
        deadlineBlock: deadline === null ? null : deadline.toString(),
      }
    })
  }

  /**
   * Resolve an epoch's FROST group public key: `getEpochGroupId(epoch)` →
   * `coordinator.groupKey(groupId)`. Cached by epoch — the epoch→group binding
   * is immutable once staged. Throws on RPC failure (including an epoch the
   * coordinator has not seen yet: `groupKey` reverts rather than returning
   * zeros) AND on an off-curve response, so {@link verifyAttestation} can treat
   * both as retryable (`PENDING`) — a corrupt response from a flaky endpoint
   * must never be cached, where it would terminalize every attestation in the
   * epoch as INVALID.
   */
  async loadGroupKey(epoch: string): Promise<{ x: string; y: string }> {
    const cached = this.groupKeyCache.get(epoch)
    if (cached) return cached
    // Derived OUTSIDE the provider op: a malformed epoch is not an endpoint
    // failure and must not burn a rotation through the URL list.
    const epochValue = BigInt(epoch)

    return this.withProvider(async (provider) => {
      const consensus = new Contract(this.consensus, [...CONSENSUS_READ_ABI], provider)
      const groupId: string = await consensus.getEpochGroupId(epochValue)
      const coordinator = new Contract(this.coordinator, [...COORDINATOR_READ_ABI], provider)
      const key = await coordinator.groupKey(groupId)
      const point = { x: key.x.toString(), y: key.y.toString() }
      if (!isValidPoint(point)) {
        throw new Error(`Safenet reader: coordinator returned an off-curve group key for epoch ${epoch}`)
      }
      this.groupKeyCache.set(epoch, point)
      return point
    })
  }

  /**
   * Verify an attested event's FROST signature against its epoch group key.
   * A group-key fetch failure is retryable (`PENDING`); a signature that does
   * not verify is terminal (`INVALID`) and must never render as BENIGN.
   * Deliberately uncached: once the epoch's group key is cached, a re-verify
   * is a pure local computation.
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

    let groupKey: { x: string; y: string }
    try {
      groupKey = await this.loadGroupKey(attested.epoch)
    } catch {
      return { status: AttestationVerificationStatus.PENDING, signatureId: attested.signatureId, message }
    }

    const verified = verifyFrostAttestation({ groupKey, attestation: attested.attestation, message })
    return {
      status: verified ? AttestationVerificationStatus.VERIFIED : AttestationVerificationStatus.INVALID,
      signatureId: attested.signatureId,
      message,
    }
  }

  /**
   * Wall-clock time of a block in milliseconds. Used to date the attestation in
   * the audit log.
   *
   * `eth_getLogs` responses carry no timestamps, so this is a separate header
   * read. Call it only once a check has an attestation. The value cannot change
   * afterwards and polling stops at that point, so it costs one extra RPC per
   * settled check rather than one per poll.
   *
   * Returns `null` on failure. A missing date leaves one column of the audit log
   * empty, which is a smaller cost than failing a read whose verdict verified.
   */
  async blockTimeMs(blockNumber: number): Promise<number | null> {
    try {
      return await this.withProvider(async (provider) => {
        const block = await provider.getBlock(blockNumber)
        // Thrown so the failure reaches withProvider: a header this endpoint
        // cannot serve may still be served by the next one.
        if (!block) throw new Error(`Safenet reader: no header for block ${blockNumber}`)
        return block.timestamp * 1000
      })
    } catch {
      return null
    }
  }
}

let defaultReader: SafenetReader | null = null

/** The process-wide pinned-provider reader singleton (built from env constants). */
export const getSafenetReader = (): SafenetReader => (defaultReader ??= new SafenetReader(readerConfigFromEnv()))
