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
  type AttestationVerification,
  type Hex,
  type NormalizedCheckEvent,
  type OracleAttestedEvent,
  type OracleProposedEvent,
  type PlainAttestedEvent,
  type WindowCoverage,
} from '../types'
import { decodeLogs, type RawLog } from '../utils/decodeLogs'
import { deadlineBlockOf } from '../utils/deriveCheckState'
import { isValidPoint, verifyAttestation as verifyFrostAttestation } from '../utils/frost'
import { plainProposalHash, transactionProposalHash } from '../utils/proposalHash'

/**
 * Everything one poll reads off-chain for a single check. Numeric values are
 * decimal strings so the result is Redux-serializable.
 */
export type CheckReadResult = {
  safeTxHash: Hex
  /** The Safenet chain the Consensus contract lives on (the config chain id). */
  chainId: string
  /** Decoded lifecycle events, sorted ascending by (blockNumber, logIndex). */
  events: NormalizedCheckEvent[]
  headBlock: string
  /**
   * Correlation metadata from the latest allowlisted proposal. Proposals are
   * permissionless, so do not render these as provenance.
   */
  requestId: Hex | null
  epoch: string | null
  oracle: string | null
  /** Block the check times out at (the request's reveal deadline). */
  deadlineBlock: string | null
  /**
   * Whether the block window this read used covers the check's whole possible
   * lifetime. An empty event set only proves the absence of a check when it does.
   */
  windowCoverage: WindowCoverage
}

export type SafenetReaderConfig = {
  /** Pinned endpoints, rotated on failure. */
  rpcUrls: string[]
  /** Feeds both the provider network and the EIP-712 request-id domain. */
  chainId: string
  consensus: string
  coordinator: string
  /** Allowlisted sentinel-oracle addresses. Empty = the oracle path is skipped. */
  oracles: string[]
}

const IS_DEV = process.env.NODE_ENV !== 'production'

const isProposed = (event: NormalizedCheckEvent): event is OracleProposedEvent =>
  event.type === CheckEventType.ORACLE_PROPOSED

/**
 * Cap on distinct requestIds per oracle in one sentinel getLogs filter — a
 * backstop against the OR-filter growing past RPC limits. Newest ids win.
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
 * (rotated on failure) and a per-epoch FROST group-key cache.
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
  private readonly groupKeyCache = new Map<string, { x: string; y: string }>()
  private readonly holds = new Map<JsonRpcProvider, number>()

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
   * Take a reference on the current endpoint. Callers MUST release it.
   *
   * Invariant: a provider is destroyed only once it is no longer current AND no
   * read still holds it. ethers' `destroy()` rejects in-flight requests, so
   * destroying on one read's failure would cancel every concurrent sibling.
   */
  private acquire(): JsonRpcProvider {
    const provider = this.provider()
    this.holds.set(provider, (this.holds.get(provider) ?? 0) + 1)
    return provider
  }

  private release(provider: JsonRpcProvider): void {
    const held = (this.holds.get(provider) ?? 1) - 1
    if (held > 0) {
      this.holds.set(provider, held)
      return
    }
    this.holds.delete(provider)
    if (this.currentProvider !== provider) provider.destroy()
  }

  /**
   * Advance to the next endpoint, unless a concurrent read already rotated
   * (rotating again would skip over healthy endpoints). Uninstalls the failed
   * provider; its last holder destroys it.
   */
  private rotate(failed: JsonRpcProvider): void {
    if (this.currentProvider !== failed) return
    this.currentProvider = null
    this.urlIndex = (this.urlIndex + 1) % this.rpcUrls.length
  }

  /** Run an op against the current endpoint, rotating through the URL list on failure. */
  private async withProvider<T>(op: (provider: JsonRpcProvider) => Promise<T>): Promise<T> {
    const attempts = Math.max(1, this.rpcUrls.length)
    let lastError: unknown
    for (let attempt = 0; attempt < attempts; attempt++) {
      const provider = this.acquire()
      try {
        return await op(provider)
      } catch (error) {
        lastError = error
        // A deterministic revert is not an endpoint failure — rethrow instead of
        // rotating. Only revert data proves a revert: ethers classifies every
        // JSON-RPC error on an eth_call as CALL_EXCEPTION, and a data-less one
        // (rate limit, pruned state) deserves the next endpoint.
        if (isCallException(error) && error.data != null) throw error
        this.rotate(provider)
      } finally {
        this.release(provider)
      }
    }
    throw lastError
  }

  /** Dev-only, one-shot: warn if the RPC's chain id disagrees with config. */
  private async assertChainId(provider: JsonRpcProvider): Promise<void> {
    if (this.chainIdChecked || !IS_DEV) return
    try {
      const actual = Number(await provider.send('eth_chainId', []))
      // Consume the one shot only after a successful probe.
      this.chainIdChecked = true
      if (actual !== Number(this.chainId)) {
        console.error(
          `[safenet-reader] chain id mismatch: SAFENET_CHAIN_ID=${this.chainId} but the RPC ` +
            `reports ${actual}. It feeds the EIP-712 domain every attestation is verified ` +
            `against, so attestations will verify as INVALID and every check will read as ` +
            `failed. Fix SAFENET_CHAIN_ID / SAFENET_RPC_URLS.`,
        )
      }
    } catch {
      // A development aid, never a hard gate on the read path.
    }
  }

  private async getLogsChunked(
    provider: JsonRpcProvider,
    filter: { address?: string; topics: Array<string | string[]>; fromBlock: number; toBlock: number },
  ): Promise<RawLog[]> {
    const ranges = chunkRanges(filter.fromBlock, filter.toBlock, GETLOGS_CHUNK_BLOCKS)
    // Issued concurrently so the provider coalesces them into one batched request.
    const chunks = await Promise.all(
      ranges.map(([fromBlock, toBlock]) =>
        provider.getLogs({ address: filter.address, topics: filter.topics, fromBlock, toBlock }),
      ),
    )
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
   * Choose the block range to read: a narrow window around the block matching
   * the transaction timestamp (constant cost at any age), or the head-relative
   * scan when no timestamp is given or the estimate did not converge. Reports
   * how much the chosen window can prove, since a caller that finds no events
   * needs to know whether the window ever covered them.
   *
   * A targeted window reaches ~12.5h past the transaction, so it only covers a
   * check's whole lifetime while it still runs to the chain head. Past that the
   * read is a sample, and a later settlement can sit outside it.
   */
  private async readRange(
    provider: JsonRpcProvider,
    timestampMs: number | null | undefined,
    head: { number: number; timestamp: number },
  ): Promise<{ fromBlock: number; toBlock: number; coverage: WindowCoverage }> {
    const headRelative = {
      fromBlock: Math.max(0, head.number - MAX_LOOKBACK_BLOCKS + 1),
      toBlock: head.number,
      // A fixed lookback is not tied to the transaction at all: it may start
      // well after the submission and never reach it.
      coverage: 'heuristic' as const,
    }
    if (timestampMs == null || !Number.isFinite(timestampMs)) return headRelative

    const targetSeconds = Math.floor(timestampMs / 1000)
    // Only a submission the chain has already seen can be located on it. Past
    // the head the estimate pins to the head and its drift measures the skew,
    // not the transaction's block, so such a window aims but proves nothing.
    const seenByChain = targetSeconds < head.timestamp
    const { block: centre, driftSeconds } = await this.estimateBlockAt(provider, targetSeconds, head)
    const converged = Math.abs(driftSeconds) <= BLOCK_ESTIMATE_TOLERANCE_SECONDS
    // Aim only when the estimate converged — converting leftover drift into a
    // block budget needs a local cadence nothing here measures. A target past
    // the head is the exception: the head is still the best aim available.
    if (seenByChain && !converged) return headRelative

    // One chunk wide, so a targeted read is always a single getLogs.
    const fromBlock = Math.max(0, centre - TARGETED_WINDOW_BACK_BLOCKS)
    const toBlock = Math.min(head.number, fromBlock + GETLOGS_CHUNK_BLOCKS - 1)
    // ponytail: `proven` reads the aim as the submission time. Ceiling: the
    // window only reaches TARGETED_WINDOW_BACK_BLOCKS (~1.4h) behind it, so an
    // aim later than the real submission by more than that can miss the
    // proposal and still report `proven`. No shipped surface can trigger it —
    // every one offers the transaction's submission date (checked against CGW
    // v1.122.0) — so the trigger is a future surface, or an upstream mapping
    // change such as the queued summary timestamp becoming the modified date.
    // Upgrade path: carry the aim's provenance so a surrogate timestamp cannot
    // license the claim, or widen the backward reach.
    return {
      fromBlock,
      toBlock,
      coverage: seenByChain && converged && toBlock >= head.number ? 'proven' : 'heuristic',
    }
  }

  /**
   * Estimate the block nearest a unix timestamp. Each refinement uses the block
   * time observed between the probe and the head, so the estimate converges even
   * when the real cadence drifts from nominal. `driftSeconds` is measured at the
   * returned block and is `Infinity` when no probe succeeded.
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
      // A failed probe (e.g. `missing trie node` on public RPC) degrades to the
      // head-relative scan rather than failing the read or burning a rotation.
      const block = await provider.getBlock(guess).catch(() => null)
      if (!block) break
      const driftSeconds = block.timestamp - targetSeconds
      const span = head.number - guess
      // Floored so a run of equal timestamps cannot divide by zero below.
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
   * for every proposal naming an allowlisted oracle — the sentinel logs keyed by
   * the derived `requestId`s. FROST verification and the status machine live
   * above this. `options.timestampMs` aims the read window (see readRange).
   */
  async fetchCheckState(safeTxHash: string, options: { timestampMs?: number | null } = {}): Promise<CheckReadResult> {
    // A malformed hash is a caller bug, not an endpoint failure.
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
      // Sorted before the requestId cap below — eth_getLogs ordering is a node
      // convention with no guarantee behind it.
      const consensusEvents = decodeLogs(consensusLogs).sort(
        (a, b) => a.blockNumber - b.blockNumber || a.logIndex - b.logIndex,
      )

      // Only proposals naming an allowlisted oracle may drive the oracle read:
      // `proposeOracleTransaction` is permissionless with a caller-chosen oracle
      // address, so an unfiltered read would accept a fabricated `OracleResult`
      // from anyone's contract.
      const proposals = consensusEvents.filter(
        (event): event is OracleProposedEvent => isProposed(event) && this.oracles.includes(event.oracle.toLowerCase()),
      )

      const requestIdsByOracle = new Map<string, Hex[]>()
      for (const proposal of proposals) {
        // The proposal hash IS the oracle requestId; oracleDataHash aims it.
        const id = transactionProposalHash({
          chainId: this.chainId,
          consensus: this.consensus,
          epoch: proposal.epoch,
          oracle: proposal.oracle,
          oracleDataHash: proposal.oracleDataHash,
          safeTxHash: safeTxHash as Hex,
        })
        // Keyed by the normalized address so one oracle cannot occupy two buckets.
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

      // The latest allowlisted proposal is the live one.
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
        ? transactionProposalHash({
            chainId: this.chainId,
            consensus: this.consensus,
            epoch: active.epoch,
            oracle: active.oracle,
            oracleDataHash: active.oracleDataHash,
            safeTxHash: safeTxHash as Hex,
          })
        : null

      const events = [...consensusEvents, ...oracleEvents].sort(
        (a, b) => a.blockNumber - b.blockNumber || a.logIndex - b.logIndex,
      )
      // The maximum across all requests: after a cross-epoch re-proposal the
      // latest deadline belongs to the request that can still resolve.
      const deadline = deadlineBlockOf(events)

      return {
        safeTxHash: safeTxHash as Hex,
        chainId: this.chainId,
        events,
        headBlock: head.toString(),
        requestId,
        epoch: active?.epoch ?? null,
        oracle: active?.oracle ?? null,
        deadlineBlock: deadline === null ? null : deadline.toString(),
        windowCoverage: range.coverage,
      }
    })
  }

  /**
   * Resolve an epoch's FROST group public key: `getEpochGroupId(epoch)` →
   * `coordinator.groupKey(groupId)`. Cached by epoch (the binding is immutable
   * once staged). Throws on RPC failure and on an off-curve response so both
   * stay retryable — a corrupt response must never be cached, where it would
   * terminalize every attestation in the epoch as INVALID.
   */
  async loadGroupKey(epoch: string): Promise<{ x: string; y: string }> {
    const cached = this.groupKeyCache.get(epoch)
    if (cached) return cached
    // Derived outside the provider op: a malformed epoch is a caller bug.
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
   * not verify is terminal (`INVALID`).
   */
  async verifyAttestation(attested: OracleAttestedEvent | PlainAttestedEvent): Promise<AttestationVerification> {
    // The two paths sign different EIP-712 preimages; the event type decides.
    const message =
      attested.type === CheckEventType.ORACLE_ATTESTED
        ? transactionProposalHash({
            chainId: this.chainId,
            consensus: this.consensus,
            epoch: attested.epoch,
            oracle: attested.oracle,
            oracleDataHash: attested.oracleDataHash,
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
   * Wall-clock time of a block in ms — dates the audit-log step. `eth_getLogs`
   * carries no timestamps, so this is one extra header read on every poll that
   * observes an attestation, including the slow polls a settled check keeps
   * making while its arbitration window is open.
   * Returns null on failure: a missing date must never suppress a verdict.
   */
  async blockTimeMs(blockNumber: number): Promise<number | null> {
    try {
      return await this.withProvider(async (provider) => {
        const block = await provider.getBlock(blockNumber)
        // Thrown so the failure reaches withProvider and the next endpoint.
        if (!block) throw new Error(`Safenet reader: no header for block ${blockNumber}`)
        return block.timestamp * 1000
      })
    } catch {
      return null
    }
  }
}

let defaultReader: SafenetReader | null = null

/** The process-wide reader singleton, built from the env constants. */
export const getSafenetReader = (): SafenetReader =>
  (defaultReader ??= new SafenetReader({
    rpcUrls: SAFENET_RPC_URLS,
    chainId: SAFENET_CHAIN_ID,
    consensus: SAFENET_CONSENSUS_ADDRESS,
    coordinator: SAFENET_COORDINATOR_ADDRESS,
    oracles: SAFENET_ORACLE_ADDRESSES,
  }))
