import { Contract, isAddress, isCallException, JsonRpcProvider, toQuantity, ZeroHash, type Result } from 'ethers'
import {
  CONSENSUS_READ_ABI,
  CONSENSUS_TOPIC0S,
  COORDINATOR_READ_ABI,
  ORACLE_READ_ABI,
  SENTINEL_TOPIC0S,
  oracleReadInterface,
} from '../abi'
import {
  BLOCK_ESTIMATE_MAX_REFINEMENTS,
  BLOCK_ESTIMATE_TOLERANCE_SECONDS,
  BLOCK_TIME_SECONDS,
  GETLOGS_CHUNK_BLOCKS,
  MAX_EVIDENCE_BLOCKS,
  MAX_LOOKBACK_BLOCKS,
  PROVIDER_BATCH_MAX_COUNT,
  SAFENET_CHAIN_ID,
  SAFENET_CONSENSUS_ADDRESS,
  SAFENET_COORDINATOR_ADDRESS,
  SAFENET_DEPLOYMENT,
  SAFENET_DEPLOYMENT_BLOCK,
  SAFENET_ORACLE_ADDRESSES,
  SAFENET_RPC_URLS,
  TARGETED_WINDOW_BACK_BLOCKS,
} from '../constants'
import {
  AttestationVerificationStatus,
  CheckEventType,
  type AttestationCandidate,
  type AttestationInput,
  type AttestationVerification,
  type Hex,
  type NormalizedCheckEvent,
  type OracleAttestedEvent,
  type OracleProposedEvent,
  type OracleRequestState,
  type RequestRead,
  type RequestRef,
  type WindowCoverage,
} from '../types'
import { matchesCheckTarget, type CheckTarget } from '../utils/attestations'
import { boundedRanges, chunkRanges, clampRanges, mergeRanges, type BlockRange } from '../utils/blockRanges'
import { decodeLogs, type RawLog } from '../utils/decodeLogs'
import { isValidPoint, verifyAttestation as verifyFrostAttestation } from '../utils/frost'
import { transactionProposalHash } from '../utils/proposalHash'
import { comparePositions, isEvidenceComplete, lexical } from '../utils/requestOutcome'
import { buildRequestRead, type RequestFacts } from '../utils/requestRead'
import {
  acceptKnownRequests,
  assertRequestCap,
  dedupeRequestRefs,
  refFromEvent,
  requestIdOf,
  type RequestDomain,
} from '../utils/requestRefs'

/**
 * Everything one poll reads off-chain for a single check, bound to the checked
 * Safe. Numeric values are decimal strings so the result is Redux-serializable.
 */
export type CheckReadResult = {
  safeTxHash: Hex
  /** The Safenet chain the Consensus contract lives on (the config chain id). */
  chainId: string
  /** Target-bound Consensus events plus the Oracle evidence of every retained request. */
  events: NormalizedCheckEvent[]
  headBlock: string
  /** Wall-clock time of the head block, in ms. */
  headAtMs: number
  /** Every target-bound request at the head, earliest proposal first. */
  requests: RequestRead[]
  /** Attestations (from logs or the getters) that may settle an approved request. */
  candidates: AttestationCandidate[]
  /**
   * Whether the discovery ranges continuously cover the deployment block through
   * the head. Only then does finding no request prove there is none.
   */
  windowCoverage: WindowCoverage
  /** Lifecycle evidence only; discovery exhaustiveness is `windowCoverage`. */
  evidenceComplete: boolean
}

export type FetchCheckStateOptions = {
  /** The Safe being viewed. Requests and attestations are bound to it before dedup and the cap. */
  target: CheckTarget
  /** A submission time that places the discovery window. A hint, never proof of absence. */
  timestampMs?: number | null
  /** Requests carried from the previous read; refreshed at the head even outside the windows. */
  knownRequests?: ReadonlyArray<RequestRef>
  /** The previous read's head. A lower head is a lagging endpoint and fails the read. */
  minimumBlock?: number
}

export type SafenetReaderConfig = {
  /** Pinned endpoints, rotated on failure. */
  rpcUrls: string[]
  /** Feeds both the provider network and the EIP-712 request-id domain. Must be Gnosis ('100'). */
  chainId: string
  consensus: string
  coordinator: string
  /** Allowlisted sentinel-oracle addresses. Must not be empty. */
  oracles: string[]
}

type Head = { number: number; timestamp: number; hash: string }

type RequestWithFacts = { ref: RequestRef; facts: RequestFacts }

/** Max concurrent RPC operations in one read — equals the provider's batch size. */
const READ_CONCURRENCY = PROVIDER_BATCH_MAX_COUNT

const REQUEST_STATES: ReadonlyArray<OracleRequestState | undefined> = [
  undefined,
  'PENDING',
  'FROZEN',
  'RESOLVED_APPROVED',
  'RESOLVED_DENIED',
  'TIMED_OUT',
]

const byLogPosition = (a: NormalizedCheckEvent, b: NormalizedCheckEvent): number =>
  a.blockNumber - b.blockNumber || a.logIndex - b.logIndex

const isRequestEvent = (event: NormalizedCheckEvent): event is OracleProposedEvent | OracleAttestedEvent =>
  event.type === CheckEventType.ORACLE_PROPOSED || event.type === CheckEventType.ORACLE_ATTESTED

const isAttested = (event: NormalizedCheckEvent): event is OracleAttestedEvent =>
  event.type === CheckEventType.ORACLE_ATTESTED

/**
 * Run `fn` over `items` with at most `limit` in flight, keeping input order.
 * The first failure stops further items from starting.
 */
const mapLimit = async <T, R>(items: ReadonlyArray<T>, limit: number, fn: (item: T) => Promise<R>): Promise<R[]> => {
  const results = new Array<R>(items.length)
  let next = 0
  let failed = false
  const worker = async (): Promise<void> => {
    while (!failed && next < items.length) {
      const index = next++
      try {
        results[index] = await fn(items[index])
      } catch (error) {
        failed = true
        throw error
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

const assertSafeTxHash = (safeTxHash: string): void => {
  // A malformed hash is a caller bug, not an endpoint failure.
  if (!/^0x[0-9a-f]{64}$/i.test(safeTxHash)) {
    throw new Error(`Safenet reader: invalid safeTxHash '${safeTxHash}'`)
  }
}

const assertTarget = (target: CheckTarget): void => {
  if (!target?.chainId || !isAddress(target.safeAddress)) throw new Error('Safenet reader: invalid check target')
}

/** Only the contract's own `RequestNotFound()` proves a request is absent. */
const isRequestNotFound = (error: unknown): boolean => {
  if (!isCallException(error) || error.data == null) return false
  try {
    return oracleReadInterface.parseError(error.data)?.name === 'RequestNotFound'
  } catch {
    return false
  }
}

const parseRequestFacts = (request: Result): RequestFacts => {
  const state = REQUEST_STATES[Number(request.progress.state)]
  if (!state) throw new Error(`Safenet reader: unknown request state ${request.progress.state}`)
  const arbitrationDeadline: bigint = request.progress.arbitrationDeadline
  return {
    state,
    commitDeadlineBlock: request.terms.commitDeadline.toString(),
    revealDeadlineBlock: request.terms.revealDeadline.toString(),
    arbitrationDeadlineBlock: arbitrationDeadline === 0n ? null : arbitrationDeadline.toString(),
    committedCount: Number(request.progress.committedCount),
    revealedCount: Number(request.progress.revealedCount),
    approveCount: Number(request.progress.approveSentinelCount),
    denyCount: Number(request.progress.denySentinelCount),
  }
}

const sameAddress = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase()

/**
 * Reject a configuration that differs from the pinned Gnosis deployment, so a
 * stale public setting can never select a retired deployment.
 */
export const assertPinnedDeployment = (config: Omit<SafenetReaderConfig, 'rpcUrls'>): void => {
  const pinned = SAFENET_DEPLOYMENT
  const oracles = config.oracles.map((address) => address.toLowerCase()).sort()
  const matches =
    config.chainId === pinned.chainId &&
    sameAddress(config.consensus, pinned.consensus) &&
    sameAddress(config.coordinator, pinned.coordinator) &&
    oracles.length === pinned.oracles.length &&
    pinned.oracles.every((address, index) => address.toLowerCase() === oracles[index])
  if (!matches) {
    throw new Error('Safenet reader: deployment configuration does not match the latest Gnosis deployment')
  }
}

/**
 * Chain reader for a check's Safenet lifecycle. Owns a pinned-endpoint provider
 * (rotated on failure), a per-provider deployment validation and a per-epoch
 * FROST group-key cache.
 */
export class SafenetReader {
  private readonly rpcUrls: string[]
  private readonly chainId: string
  private readonly consensus: string
  private readonly coordinator: string
  private readonly oracles: readonly string[]
  private readonly domain: RequestDomain

  private urlIndex = 0
  private currentProvider: JsonRpcProvider | null = null
  private readonly deployments = new WeakMap<JsonRpcProvider, Promise<void>>()
  private readonly groupKeyCache = new Map<string, { x: string; y: string }>()
  private readonly holds = new Map<JsonRpcProvider, number>()

  constructor(config: SafenetReaderConfig) {
    if (config.chainId !== SAFENET_DEPLOYMENT.chainId) {
      throw new Error(`Safenet reader: only Gnosis Chain (${SAFENET_DEPLOYMENT.chainId}) is supported`)
    }
    if (config.oracles.length === 0) throw new Error('Safenet reader: the Oracle allowlist must not be empty')
    this.rpcUrls = config.rpcUrls
    this.chainId = config.chainId
    this.consensus = config.consensus
    this.coordinator = config.coordinator
    this.oracles = config.oracles.map((address) => address.toLowerCase())
    this.domain = { chainId: this.chainId, consensus: this.consensus }
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

  /**
   * Prove the endpoint serves the configured deployment before any log or group
   * key from it is trusted. The result is cached per provider; concurrent callers
   * share one in-flight validation, and a failure is forgotten so a retry runs.
   */
  private assertDeployment(provider: JsonRpcProvider): Promise<void> {
    const cached = this.deployments.get(provider)
    if (cached) return cached
    const validation = this.validateDeployment(provider)
    this.deployments.set(provider, validation)
    validation.catch(() => {
      if (this.deployments.get(provider) === validation) this.deployments.delete(provider)
    })
    return validation
  }

  private async validateDeployment(provider: JsonRpcProvider): Promise<void> {
    // `getNetwork()` only echoes the configured static network, so probe the node itself.
    const served = BigInt(await provider.send('eth_chainId', []))
    if (served !== BigInt(this.chainId)) {
      throw new Error(`Safenet reader: RPC serves chain ${served}, expected Gnosis Chain (${this.chainId})`)
    }
    const consensus = new Contract(this.consensus, [...CONSENSUS_READ_ABI], provider)
    const [coordinator, proposers] = await Promise.all([
      consensus.getCoordinator() as Promise<string>,
      Promise.all(this.oracles.map((oracle) => new Contract(oracle, [...ORACLE_READ_ABI], provider).PROPOSER())),
    ])
    if (!sameAddress(coordinator, this.coordinator)) {
      throw new Error('Safenet reader: Consensus coordinator does not match the configured deployment')
    }
    proposers.forEach((proposer: string, index) => {
      if (!sameAddress(proposer, this.consensus)) {
        throw new Error(`Safenet reader: Oracle ${this.oracles[index]} is not proposed by the configured Consensus`)
      }
    })
  }

  private async getLogsChunked(
    provider: JsonRpcProvider,
    filter: { address?: string; topics: Array<string | string[]> },
    ranges: ReadonlyArray<BlockRange>,
  ): Promise<RawLog[]> {
    const chunks = mergeRanges(ranges).flatMap(([from, to]) => chunkRanges(from, to, GETLOGS_CHUNK_BLOCKS))
    // Bounded so the provider coalesces them into batched requests without an unbounded burst.
    const results = await mapLimit(chunks, READ_CONCURRENCY, ([fromBlock, toBlock]) =>
      provider.getLogs({ address: filter.address, topics: filter.topics, fromBlock, toBlock }),
    )
    return results.flat().map((log) => ({
      address: log.address,
      topics: [...log.topics],
      data: log.data,
      blockNumber: log.blockNumber,
      logIndex: log.index,
      transactionHash: log.transactionHash,
    }))
  }

  private async readHead(provider: JsonRpcProvider, minimumBlock?: number): Promise<Head> {
    const latest = await provider.getBlock('latest')
    if (!latest?.hash) throw new Error('Safenet reader: could not read the chain head')
    if (minimumBlock !== undefined && latest.number < minimumBlock) {
      throw new Error('Safenet reader: endpoint is behind the previous read')
    }
    if (latest.number < SAFENET_DEPLOYMENT_BLOCK) throw new Error('Safenet reader: endpoint head predates deployment')
    return { number: latest.number, timestamp: latest.timestamp, hash: latest.hash }
  }

  /**
   * The narrow window around the block matching a submission timestamp (constant
   * cost at any age), or null when there is no usable hint or the block estimate
   * did not converge. The window is a hint: it never proves anything is absent.
   */
  private async aimedRange(
    provider: JsonRpcProvider,
    timestampMs: number | null | undefined,
    head: Head,
  ): Promise<BlockRange | null> {
    if (timestampMs == null || !Number.isFinite(timestampMs)) return null
    const targetSeconds = Math.floor(timestampMs / 1000)
    // A target past the head pins the estimate to the head, whose drift measures
    // clock skew rather than the transaction's block, so only a seen target must converge.
    const seenByChain = targetSeconds < head.timestamp
    const { block: centre, driftSeconds } = await this.estimateBlockAt(provider, targetSeconds, head)
    if (seenByChain && Math.abs(driftSeconds) > BLOCK_ESTIMATE_TOLERANCE_SECONDS) return null
    // One chunk wide, so an aimed read is a single getLogs.
    const fromBlock = Math.max(0, centre - TARGETED_WINDOW_BACK_BLOCKS)
    return [fromBlock, Math.min(head.number, fromBlock + GETLOGS_CHUNK_BLOCKS - 1)]
  }

  /**
   * The ranges to scan for the check's Consensus events: the aimed window and,
   * unless it already reaches the head, the recent lookback tail. Clamped to the
   * deployment block. Coverage is `proven` only when they continuously span the
   * deployment block through the head.
   */
  private async discoveryRanges(
    provider: JsonRpcProvider,
    timestampMs: number | null | undefined,
    head: Head,
  ): Promise<{ ranges: BlockRange[]; coverage: WindowCoverage }> {
    const aimed = await this.aimedRange(provider, timestampMs, head)
    const wanted: BlockRange[] = aimed ? [aimed] : []
    if (!aimed || aimed[1] < head.number) wanted.push([head.number - MAX_LOOKBACK_BLOCKS + 1, head.number])
    const ranges = mergeRanges(clampRanges(wanted, SAFENET_DEPLOYMENT_BLOCK))
    const [first] = ranges
    const proven = ranges.length === 1 && first[0] === SAFENET_DEPLOYMENT_BLOCK && first[1] === head.number
    return { ranges, coverage: proven ? 'proven' : 'heuristic' }
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
   * Discover the check's requests: Consensus logs keyed by `safeTxHash`, kept only
   * when they name an allowlisted Oracle AND the viewed Safe, then merged with the
   * carried requests. Binding happens before request-id dedup and the cap, so a
   * same-hash request of another Safe or home chain never takes a slot.
   */
  private async discoverRequests(
    provider: JsonRpcProvider,
    safeTxHash: Hex,
    options: FetchCheckStateOptions,
    head: Head,
  ): Promise<{ events: NormalizedCheckEvent[]; refs: RequestRef[]; carriedOnly: Set<Hex>; coverage: WindowCoverage }> {
    const { ranges, coverage } = await this.discoveryRanges(provider, options.timestampMs, head)
    const logs = await this.getLogsChunked(
      provider,
      { address: this.consensus, topics: [[...CONSENSUS_TOPIC0S], safeTxHash] },
      ranges,
    )
    // Sorted before any cap — eth_getLogs ordering is a node convention with no guarantee behind it.
    const events = decodeLogs(logs)
      .filter(isRequestEvent)
      .filter((event) => this.oracles.includes(event.oracle.toLowerCase()) && matchesCheckTarget(event, options.target))
      .sort(byLogPosition)

    const discovered = events.map((event) => refFromEvent(this.domain, event))
    const known = acceptKnownRequests(this.domain, safeTxHash, options.target, this.oracles, options.knownRequests)
    const refs = dedupeRequestRefs([...discovered, ...known])
    assertRequestCap(refs)

    const seen = new Set(discovered.map((ref) => ref.requestId))
    const carriedOnly = new Set(refs.filter((ref) => !seen.has(ref.requestId)).map((ref) => ref.requestId))
    return { events, refs, carriedOnly, coverage }
  }

  /**
   * Read each request's authoritative state at the head. A request this read
   * discovered that the Oracle does not know is inconsistent and fails the read.
   * A carried one is dropped only on the contract's explicit `RequestNotFound()`,
   * and only with a prior head to prove this endpoint is not behind it.
   */
  private async readRequestFacts(
    provider: JsonRpcProvider,
    refs: ReadonlyArray<RequestRef>,
    carriedOnly: ReadonlySet<Hex>,
    head: Head,
    minimumBlock?: number,
  ): Promise<RequestWithFacts[]> {
    const read = await mapLimit(refs, READ_CONCURRENCY, async (ref) => {
      const oracle = new Contract(ref.oracle, [...ORACLE_READ_ABI], provider)
      try {
        return parseRequestFacts(await oracle.getRequest(ref.requestId, { blockTag: head.number }))
      } catch (error) {
        if (isRequestNotFound(error)) return null
        throw error
      }
    })
    const requests: RequestWithFacts[] = []
    refs.forEach((ref, index) => {
      const facts = read[index]
      if (facts) requests.push({ ref, facts })
      else if (!carriedOnly.has(ref.requestId) || minimumBlock === undefined) {
        throw new Error(`Safenet reader: request ${ref.requestId} is missing from the Oracle`)
      }
    })
    return requests
  }

  /**
   * Fetch the Oracle logs of the retained requests through the head, one scan per
   * Oracle (not per sentinel). Each Oracle group is bounded by `MAX_EVIDENCE_BLOCKS`;
   * a longer span reads only its two ends and marks the group's evidence incomplete.
   * An attested-only request has no known proposal, so its lower bound is the deployment block.
   */
  private async readEvidence(
    provider: JsonRpcProvider,
    refs: ReadonlyArray<RequestRef>,
    head: Head,
  ): Promise<{ events: NormalizedCheckEvent[]; covered: Map<Hex, boolean> }> {
    const groups = new Map<string, RequestRef[]>()
    for (const ref of refs) {
      const key = ref.oracle.toLowerCase()
      groups.set(key, [...(groups.get(key) ?? []), ref])
    }
    const events: NormalizedCheckEvent[] = []
    const covered = new Map<Hex, boolean>()
    for (const [oracle, group] of groups) {
      const from = Math.min(...group.map((ref) => ref.proposedAt?.blockNumber ?? SAFENET_DEPLOYMENT_BLOCK))
      const { ranges, complete } = boundedRanges(from, head.number, MAX_EVIDENCE_BLOCKS)
      const logs = await this.getLogsChunked(
        provider,
        { address: oracle, topics: [[...SENTINEL_TOPIC0S], group.map((ref) => ref.requestId)] },
        ranges,
      )
      events.push(...decodeLogs(logs))
      group.forEach((ref) => covered.set(ref.requestId, complete))
    }
    return { events, covered }
  }

  /**
   * The attestation candidates of the retained requests. An attested log is the
   * candidate for its request. An approved request with no such log (clipped from
   * the window) falls back to the Consensus getters at the same head: a zero
   * signature id is no attestation, and a getter failure fails the read.
   */
  private async readCandidates(
    provider: JsonRpcProvider,
    requests: ReadonlyArray<RequestRead>,
    consensusEvents: ReadonlyArray<NormalizedCheckEvent>,
    safeTxHash: Hex,
    head: Head,
  ): Promise<AttestationCandidate[]> {
    const retained = new Set(requests.map((request) => request.requestId))
    const logged = consensusEvents
      .filter(isAttested)
      .map((event) => ({
        requestId: requestIdOf(this.domain, event, safeTxHash),
        input: {
          epoch: event.epoch,
          oracle: event.oracle,
          oracleDataHash: event.oracleDataHash,
          safeTxHash: event.safeTxHash,
          signatureId: event.signatureId,
          attestation: event.attestation,
        },
        event,
      }))
      .filter(({ requestId }) => retained.has(requestId))
    const withLog = new Set(logged.map(({ requestId }) => requestId))
    const missing = requests.filter((request) => request.outcome === 'APPROVED' && !withLog.has(request.requestId))
    const fetched = await mapLimit(missing, READ_CONCURRENCY, (request) =>
      this.readAttestationGetter(provider, request, safeTxHash, head),
    )
    return [...logged, ...fetched.filter((candidate): candidate is AttestationCandidate => candidate !== null)]
  }

  private async readAttestationGetter(
    provider: JsonRpcProvider,
    request: RequestRead,
    safeTxHash: Hex,
    head: Head,
  ): Promise<AttestationCandidate | null> {
    const consensus = new Contract(this.consensus, [...CONSENSUS_READ_ABI], provider)
    const overrides = { blockTag: head.number }
    const signatureId: Hex = await consensus.getAttestationSignatureId(request.requestId, overrides)
    if (signatureId === ZeroHash) return null
    const signature = await consensus.getTransactionAttestationByHash(
      BigInt(request.epoch),
      request.oracle,
      request.oracleDataHash,
      safeTxHash,
      overrides,
    )
    return {
      requestId: request.requestId,
      input: {
        epoch: request.epoch,
        oracle: request.oracle,
        oracleDataHash: request.oracleDataHash,
        safeTxHash,
        signatureId,
        attestation: { r: { x: signature.r.x.toString(), y: signature.r.y.toString() }, z: signature.z.toString() },
      },
      event: null,
    }
  }

  /**
   * Fail unless the node still serves the head this read started from. A fresh
   * `eth_getBlockByNumber`, since ethers' `getBlock` may answer from its cache.
   */
  private async assertHeadStable(provider: JsonRpcProvider, head: Head): Promise<void> {
    const block: { hash?: string } | null = await provider.send('eth_getBlockByNumber', [
      toQuantity(head.number),
      false,
    ])
    if (block?.hash?.toLowerCase() !== head.hash.toLowerCase()) {
      throw new Error('Safenet reader: chain head changed during the read')
    }
  }

  /**
   * Read a check's lifecycle at one head: its requests (discovered and carried),
   * each request's authoritative state, bounded Oracle evidence and attestation
   * candidates. FROST verification and the status machine live above this.
   * `options.timestampMs` aims the discovery window (see aimedRange).
   */
  async fetchCheckState(safeTxHash: string, options: FetchCheckStateOptions): Promise<CheckReadResult> {
    assertSafeTxHash(safeTxHash)
    assertTarget(options.target)
    const hash = safeTxHash as Hex

    return this.withProvider(async (provider) => {
      await this.assertDeployment(provider)
      const head = await this.readHead(provider, options.minimumBlock)
      const discovery = await this.discoverRequests(provider, hash, options, head)
      const retained = await this.readRequestFacts(
        provider,
        discovery.refs,
        discovery.carriedOnly,
        head,
        options.minimumBlock,
      )
      const evidence = await this.readEvidence(
        provider,
        retained.map(({ ref }) => ref),
        head,
      )
      const requests = retained
        .map(({ ref, facts }) =>
          buildRequestRead({
            ref,
            facts,
            evidence: evidence.events,
            coverageComplete: evidence.covered.get(ref.requestId) === true,
          }),
        )
        .sort((a, b) => comparePositions(a.proposedAt, b.proposedAt, 1) || lexical(a.requestId, b.requestId))
      const candidates = await this.readCandidates(provider, requests, discovery.events, hash, head)
      await this.assertHeadStable(provider, head)

      return {
        safeTxHash: hash,
        chainId: this.chainId,
        events: [...discovery.events, ...evidence.events].sort(byLogPosition),
        headBlock: head.number.toString(),
        headAtMs: head.timestamp * 1000,
        requests,
        candidates,
        windowCoverage: discovery.coverage,
        evidenceComplete: isEvidenceComplete(requests, discovery.coverage),
      }
    })
  }

  /**
   * Resolve an epoch's FROST group public key: `getEpochGroupId(epoch)` →
   * `coordinator.groupKey(groupId)`, on an endpoint whose deployment was proven
   * first. Cached by epoch (the binding is immutable once staged). Throws on RPC
   * failure and on an off-curve response so both stay retryable — a corrupt
   * response must never be cached, where it would terminalize every attestation
   * in the epoch as INVALID.
   */
  async loadGroupKey(epoch: string): Promise<{ x: string; y: string }> {
    // Derived outside the provider op: a malformed epoch is a caller bug.
    const epochValue = BigInt(epoch)

    return this.withProvider(async (provider) => {
      await this.assertDeployment(provider)
      const cached = this.groupKeyCache.get(epoch)
      if (cached) return cached
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
   * Verify an attestation's FROST signature against its epoch group key. The
   * input is the same whether it came from a log or a getter. A group-key fetch
   * failure is retryable (`PENDING`); a signature that does not verify is
   * terminal (`INVALID`).
   */
  async verifyAttestation(attested: AttestationInput): Promise<AttestationVerification> {
    const message = transactionProposalHash({
      chainId: this.chainId,
      consensus: this.consensus,
      epoch: attested.epoch,
      oracle: attested.oracle,
      oracleDataHash: attested.oracleDataHash,
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
   * carries no timestamps, so this is one extra header read per dated attestation.
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

/** The process-wide reader singleton, built from the env constants and the pinned deployment. */
export const getSafenetReader = (): SafenetReader => {
  if (!defaultReader) {
    const config: SafenetReaderConfig = {
      rpcUrls: SAFENET_RPC_URLS,
      chainId: SAFENET_CHAIN_ID,
      consensus: SAFENET_CONSENSUS_ADDRESS,
      coordinator: SAFENET_COORDINATOR_ADDRESS,
      oracles: SAFENET_ORACLE_ADDRESSES,
    }
    assertPinnedDeployment(config)
    defaultReader = new SafenetReader(config)
  }
  return defaultReader
}
