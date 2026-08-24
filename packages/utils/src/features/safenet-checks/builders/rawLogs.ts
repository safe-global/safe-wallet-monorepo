import { faker } from '@faker-js/faker'
import { keccak256, toBeHex, ZeroAddress, type Interface } from 'ethers'
import { consensusInterface, consensusPlainInterface, sentinelInterface } from '../abi'
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

/** keccak256 of empty `oracleData` — what every current proposal carries. */
export const EMPTY_ORACLE_DATA_HASH = keccak256('0x')

/** Pack a `SafeId.T`: `chainId << 160 | safe`. */
const safeId = (chainId: bigint, safe: string): string => toBeHex((chainId << 160n) | BigInt(safe), 32)

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

// --- Consensus (unified oracle pair) -------------------------------------------

export const buildOracleProposedLog = (
  spec: {
    safeTxHash?: string
    chainId?: bigint
    safe?: string
    epoch?: bigint
    oracle?: string
    oracleData?: string
  } = {},
  meta: LogMeta = {},
): RawLog => {
  const chainId = spec.chainId ?? 100n
  const safe = spec.safe ?? addr()
  return encode(
    consensusInterface,
    'TransactionProposed',
    [
      spec.safeTxHash ?? hash(),
      safeId(chainId, safe),
      spec.oracle ?? ORACLE,
      spec.epoch ?? 1n,
      spec.oracleData ?? '0x',
      txTuple(chainId, safe),
    ],
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
    oracleDataHash?: string
    signatureId?: string
    r?: { x: bigint; y: bigint }
    z?: bigint
  } = {},
  meta: LogMeta = {},
): RawLog => {
  const r = spec.r ?? { x: faker.number.bigInt(), y: faker.number.bigInt() }
  return encode(
    consensusInterface,
    'TransactionAttested',
    [
      spec.safeTxHash ?? hash(),
      safeId(spec.chainId ?? 100n, spec.safe ?? addr()),
      spec.oracle ?? ORACLE,
      spec.epoch ?? 1n,
      spec.oracleDataHash ?? EMPTY_ORACLE_DATA_HASH,
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

// --- Sentinel oracle ------------------------------------------------------------

export const buildNewRequestLog = (
  spec: {
    requestId?: string
    sponsor?: string
    fee?: bigint
    bondTarget?: bigint
    slashAmount?: bigint
    commitDeadline?: bigint
    revealDeadline?: bigint
  } = {},
  meta: LogMeta = {},
): RawLog =>
  encode(
    sentinelInterface,
    'NewRequest',
    [
      spec.requestId ?? hash(),
      spec.sponsor ?? addr(),
      spec.fee ?? 1000n,
      spec.bondTarget ?? 10000n,
      spec.slashAmount ?? 100n,
      spec.commitDeadline ?? 150n,
      spec.revealDeadline ?? 160n,
    ],
    meta,
    ORACLE,
  )

export const buildCommittedLog = (
  spec: { requestId?: string; sentinel?: string; bondAmount?: bigint } = {},
  meta: LogMeta = {},
): RawLog =>
  encode(
    sentinelInterface,
    'Committed',
    [spec.requestId ?? hash(), spec.sentinel ?? addr(), spec.bondAmount ?? 5000n],
    meta,
    ORACLE,
  )

export const buildRevealedLog = (
  spec: { requestId?: string; sentinel?: string; approved?: boolean; bondAmount?: bigint; reason?: string } = {},
  meta: LogMeta = {},
): RawLog =>
  encode(
    sentinelInterface,
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

export const buildOracleResultLog = (
  spec: { requestId?: string; sponsor?: string; result?: string; approved?: boolean } = {},
  meta: LogMeta = {},
): RawLog =>
  encode(
    sentinelInterface,
    'OracleResult',
    [spec.requestId ?? hash(), spec.sponsor ?? addr(), spec.result ?? '0x', spec.approved ?? true],
    meta,
    ORACLE,
  )

export const buildDisputeResolvedLog = (
  spec: { requestId?: string; outcome?: number; slashed?: bigint; reason?: string } = {},
  meta: LogMeta = {},
): RawLog =>
  encode(
    sentinelInterface,
    'DisputeResolved',
    [spec.requestId ?? hash(), spec.outcome ?? 0, spec.slashed ?? 0n, spec.reason ?? ''],
    meta,
    ORACLE,
  )

// --- Lifecycle sequence -------------------------------------------------------

/** A full commit-reveal lifecycle: proposed → request → commit → reveal → result → attestation. */
export const buildLifecycle = (
  opts: { safeTxHash?: string; requestId?: string; oracle?: string; epoch?: bigint; revealDeadline?: bigint } = {},
): RawLog[] => {
  const safeTxHash = opts.safeTxHash ?? hash()
  const requestId = opts.requestId ?? hash()
  const oracle = opts.oracle ?? ORACLE
  const epoch = opts.epoch ?? 1n

  return [
    buildOracleProposedLog({ safeTxHash, epoch, oracle }),
    buildNewRequestLog({ requestId, revealDeadline: opts.revealDeadline ?? 160n }),
    buildCommittedLog({ requestId }),
    buildRevealedLog({ requestId, approved: true }),
    buildOracleResultLog({ requestId, approved: true }),
    buildOracleAttestedLog({ safeTxHash, epoch, oracle }),
  ]
}
