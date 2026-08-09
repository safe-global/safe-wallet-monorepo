import { faker } from '@faker-js/faker'
import { ZeroAddress, type Interface } from 'ethers'
import {
  consensusInterface,
  consensusPlainInterface,
  sharedOracleInterface,
  v1SentinelInterface,
  v2SentinelInterface,
} from '../abi'
import type { RawLog } from '../utils/decodeLogs'

/**
 * Faker builders that ABI-encode the real event fragments into raw logs. Since
 * they encode through the exact `Interface`s the decoder uses, a decode of their
 * output round-trips the true onchain wire format. These builders are the ONLY
 * source of synthetic test data — the derived `checkEvents` factories decode
 * their output, and the lifecycle tests build sequences from them directly.
 */

let logCounter = 0

/** Reset the auto-increment block/logIndex counter for deterministic fixtures. */
export const resetLogCounter = (): void => {
  logCounter = 0
}

type LogMeta = { blockNumber?: number; logIndex?: number; transactionHash?: string }

const hash = (): string => faker.string.hexadecimal({ length: 64, prefix: '0x', casing: 'lower' })
const addr = (): string => faker.finance.ethereumAddress()

const encode = (
  iface: Interface,
  name: string,
  values: ReadonlyArray<unknown>,
  meta: LogMeta,
  address: string,
): RawLog => {
  const { data, topics } = iface.encodeEventLog(name, values as unknown[])
  const step = logCounter++
  return {
    address,
    topics,
    data,
    blockNumber: meta.blockNumber ?? 100 + step,
    logIndex: meta.logIndex ?? step,
    transactionHash: meta.transactionHash ?? hash(),
  }
}

const CONSENSUS = '0x223624cBF099e5a8f8cD5aF22aFa424a1d1acEE9'
const ORACLE = '0x00000000000000000000000000000000000000AA'

const txTuple = (chainId: bigint, safe: string): unknown[] => [
  chainId,
  safe,
  addr(),
  0n,
  '0x',
  0,
  0n,
  0n,
  0n,
  ZeroAddress,
  ZeroAddress,
  faker.number.bigInt({ min: 0n, max: 1000n }),
]

// --- Consensus (generation-agnostic) ------------------------------------------

export const buildOracleProposedLog = (
  spec: { safeTxHash?: string; chainId?: bigint; safe?: string; epoch?: bigint; oracle?: string } = {},
  meta: LogMeta = {},
): RawLog => {
  const chainId = spec.chainId ?? 100n
  const safe = spec.safe ?? addr()
  return encode(
    consensusInterface,
    'OracleTransactionProposed',
    [spec.safeTxHash ?? hash(), chainId, safe, spec.epoch ?? 1n, spec.oracle ?? ORACLE, txTuple(chainId, safe)],
    meta,
    CONSENSUS,
  )
}

export const buildOracleAttestedLog = (
  spec: {
    safeTxHash?: string
    chainId?: bigint
    safe?: string
    epoch?: bigint
    oracle?: string
    signatureId?: string
    r?: { x: bigint; y: bigint }
    z?: bigint
  } = {},
  meta: LogMeta = {},
): RawLog => {
  const r = spec.r ?? { x: faker.number.bigInt(), y: faker.number.bigInt() }
  return encode(
    consensusInterface,
    'OracleTransactionAttested',
    [
      spec.safeTxHash ?? hash(),
      spec.chainId ?? 100n,
      spec.safe ?? addr(),
      spec.epoch ?? 1n,
      spec.oracle ?? ORACLE,
      spec.signatureId ?? hash(),
      [[r.x, r.y], spec.z ?? faker.number.bigInt()],
    ],
    meta,
    CONSENSUS,
  )
}

// --- Consensus non-oracle (plain) pair — what live beta emits ------------------

export const buildPlainProposedLog = (
  spec: { safeTxHash?: string; chainId?: bigint; safe?: string; epoch?: bigint } = {},
  meta: LogMeta = {},
): RawLog => {
  const chainId = spec.chainId ?? 100n
  const safe = spec.safe ?? addr()
  return encode(
    consensusPlainInterface,
    'TransactionProposed',
    [spec.safeTxHash ?? hash(), chainId, safe, spec.epoch ?? 1n, txTuple(chainId, safe)],
    meta,
    CONSENSUS,
  )
}

export const buildPlainAttestedLog = (
  spec: {
    safeTxHash?: string
    chainId?: bigint
    safe?: string
    epoch?: bigint
    signatureId?: string
    r?: { x: bigint; y: bigint }
    z?: bigint
  } = {},
  meta: LogMeta = {},
): RawLog => {
  const r = spec.r ?? { x: faker.number.bigInt(), y: faker.number.bigInt() }
  return encode(
    consensusPlainInterface,
    'TransactionAttested',
    [
      spec.safeTxHash ?? hash(),
      spec.chainId ?? 100n,
      spec.safe ?? addr(),
      spec.epoch ?? 1n,
      spec.signatureId ?? hash(),
      [[r.x, r.y], spec.z ?? faker.number.bigInt()],
    ],
    meta,
    CONSENSUS,
  )
}

// --- V1 sentinel --------------------------------------------------------------

export const buildV1NewRequestLog = (
  spec: { requestId?: string; proposer?: string; fee?: bigint; bondTarget?: bigint; deadline?: bigint } = {},
  meta: LogMeta = {},
): RawLog =>
  encode(
    v1SentinelInterface,
    'NewRequest',
    [
      spec.requestId ?? hash(),
      spec.proposer ?? addr(),
      spec.fee ?? 1000n,
      spec.bondTarget ?? 5000n,
      spec.deadline ?? 150n,
    ],
    meta,
    ORACLE,
  )

export const buildV1CommittedLog = (
  spec: { requestId?: string; sentinel?: string; approved?: boolean; bondAmount?: bigint; position?: bigint } = {},
  meta: LogMeta = {},
): RawLog =>
  encode(
    v1SentinelInterface,
    'Committed',
    [
      spec.requestId ?? hash(),
      spec.sentinel ?? addr(),
      spec.approved ?? true,
      spec.bondAmount ?? 5000n,
      spec.position ?? 0n,
    ],
    meta,
    ORACLE,
  )

// --- V2 sentinel --------------------------------------------------------------

export const buildV2NewRequestLog = (
  spec: {
    requestId?: string
    proposer?: string
    fee?: bigint
    bondTarget?: bigint
    commitDeadline?: bigint
    revealDeadline?: bigint
  } = {},
  meta: LogMeta = {},
): RawLog =>
  encode(
    v2SentinelInterface,
    'NewRequest',
    [
      spec.requestId ?? hash(),
      spec.proposer ?? addr(),
      spec.fee ?? 1000n,
      spec.bondTarget ?? 5000n,
      spec.commitDeadline ?? 150n,
      spec.revealDeadline ?? 160n,
    ],
    meta,
    ORACLE,
  )

export const buildV2CommittedLog = (
  spec: { requestId?: string; sentinel?: string; bondAmount?: bigint } = {},
  meta: LogMeta = {},
): RawLog =>
  encode(
    v2SentinelInterface,
    'Committed',
    [spec.requestId ?? hash(), spec.sentinel ?? addr(), spec.bondAmount ?? 5000n],
    meta,
    ORACLE,
  )

export const buildV2RevealedLog = (
  spec: { requestId?: string; sentinel?: string; approved?: boolean; bondAmount?: bigint; reason?: string } = {},
  meta: LogMeta = {},
): RawLog =>
  encode(
    v2SentinelInterface,
    'Revealed',
    [
      spec.requestId ?? hash(),
      spec.sentinel ?? addr(),
      spec.approved ?? true,
      spec.bondAmount ?? 5000n,
      spec.reason ?? '',
    ],
    meta,
    ORACLE,
  )

// --- Shared oracle result / dispute -------------------------------------------

export const buildOracleResultLog = (
  spec: { requestId?: string; proposer?: string; result?: string; approved?: boolean } = {},
  meta: LogMeta = {},
): RawLog =>
  encode(
    sharedOracleInterface,
    'OracleResult',
    [spec.requestId ?? hash(), spec.proposer ?? addr(), spec.result ?? '0x', spec.approved ?? true],
    meta,
    ORACLE,
  )

export const buildDisputeResolvedLog = (
  spec: { requestId?: string; outcome?: number; slashed?: bigint } = {},
  meta: LogMeta = {},
): RawLog =>
  encode(
    sharedOracleInterface,
    'DisputeResolved',
    [spec.requestId ?? hash(), spec.outcome ?? 0, spec.slashed ?? 0n],
    meta,
    ORACLE,
  )

// --- Lifecycle sequence -------------------------------------------------------

/**
 * A full V1 (direct-commit) lifecycle: proposed → request → sentinel commit →
 * oracle result → attestation.
 */
export const buildV1Lifecycle = (
  opts: { safeTxHash?: string; requestId?: string; oracle?: string; epoch?: bigint; deadline?: bigint } = {},
): RawLog[] => {
  const safeTxHash = opts.safeTxHash ?? hash()
  const requestId = opts.requestId ?? hash()
  const oracle = opts.oracle ?? ORACLE
  const epoch = opts.epoch ?? 1n

  return [
    buildOracleProposedLog({ safeTxHash, epoch, oracle }),
    buildV1NewRequestLog({ requestId, deadline: opts.deadline ?? 150n }),
    buildV1CommittedLog({ requestId, approved: true }),
    buildOracleResultLog({ requestId, approved: true }),
    buildOracleAttestedLog({ safeTxHash, epoch, oracle }),
  ]
}

/** A full V2 (commit-reveal) lifecycle: proposed → request → commit → reveal → result → attestation. */
export const buildV2Lifecycle = (
  opts: { safeTxHash?: string; requestId?: string; oracle?: string; epoch?: bigint; revealDeadline?: bigint } = {},
): RawLog[] => {
  const safeTxHash = opts.safeTxHash ?? hash()
  const requestId = opts.requestId ?? hash()
  const oracle = opts.oracle ?? ORACLE
  const epoch = opts.epoch ?? 1n

  return [
    buildOracleProposedLog({ safeTxHash, epoch, oracle }),
    buildV2NewRequestLog({ requestId, revealDeadline: opts.revealDeadline ?? 160n }),
    buildV2CommittedLog({ requestId }),
    buildV2RevealedLog({ requestId, approved: true }),
    buildOracleResultLog({ requestId, approved: true }),
    buildOracleAttestedLog({ safeTxHash, epoch, oracle }),
  ]
}
