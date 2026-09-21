import { SENTINEL_ADDRESS } from '@safe-global/utils/utils/constants'
import { getMultiSendCallOnlyDeployments } from '@safe-global/safe-deployments'
import { getChainAgnosticAddress } from '@safe-global/utils/services/contracts/deployments'
import { type SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { Delay } from '@gnosis.pm/zodiac'
import type { TransactionAddedEvent } from '@gnosis.pm/zodiac/dist/cjs/types/Delay'
import { toBeHex, type JsonRpcProvider } from 'ethers'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { isMultiSendCalldata } from '@/utils/transaction-calldata'
import { decodeMultiSendData } from '@safe-global/protocol-kit'
import { multicall } from '@safe-global/utils/utils/multicall'

export const MAX_RECOVERER_PAGE_SIZE = 100

type AddedEvent = TransactionAddedEvent.Log
export type RecoveryQueueItem = AddedEvent & {
  timestamp: bigint
  validFrom: bigint
  expiresAt: bigint | null
  isMalicious: boolean
  executor: string
}

export type RecoveryStateItem = {
  address: string
  recoverers: Array<string>
  expiry: bigint
  delay: bigint
  txNonce: bigint
  queueNonce: bigint
  queue: Array<RecoveryQueueItem>
}

export type RecoveryState = Array<RecoveryStateItem>

export function _isMaliciousRecovery({
  chainId,
  version,
  safeAddress,
  transaction,
}: {
  chainId: string
  version: SafeState['version']
  safeAddress: string
  transaction: Pick<AddedEvent['args'], 'to' | 'data'>
}) {
  const BASE_MULTI_SEND_CALL_ONLY_VERSION = '1.3.0'

  const isMultiSend = isMultiSendCalldata(transaction.data)
  const transactions = isMultiSend ? decodeMultiSendData(transaction.data) : [transaction]

  if (!isMultiSend) {
    // Calling the Safe itself
    return !sameAddress(transaction.to, safeAddress)
  }

  const multiSendDeployment =
    getMultiSendCallOnlyDeployments({ version: version ?? undefined }) ??
    getMultiSendCallOnlyDeployments({ version: BASE_MULTI_SEND_CALL_ONLY_VERSION })

  const multiSendAddress = getChainAgnosticAddress(multiSendDeployment, chainId)

  if (!multiSendAddress) {
    return true
  }

  // Calling official MultiSend contract with a batch of transactions to the Safe itself
  return (
    !sameAddress(transaction.to, multiSendAddress) ||
    transactions.some((transaction) => !sameAddress(transaction.to, safeAddress))
  )
}

export const _getRecoveryQueueItemTimestamps = async ({
  delayModifier,
  transactionAdded,
  delay,
  expiry,
}: {
  delayModifier: Delay
  transactionAdded: AddedEvent
  delay: bigint
  expiry: bigint
}): Promise<Pick<RecoveryQueueItem, 'timestamp' | 'validFrom' | 'expiresAt'>> => {
  const timestamp = BigInt(await delayModifier.txCreatedAt(transactionAdded.args.queueNonce))
  const validFrom = timestamp + delay
  const expiresAt =
    expiry === BigInt(0)
      ? null // Never expires
      : (validFrom + expiry) * BigInt(1000)

  return {
    timestamp: timestamp * BigInt(1000),
    validFrom: validFrom * BigInt(1000),
    expiresAt,
  }
}

// Infura caps eth_getLogs at 10k blocks; the window halves on rejection for stricter RPCs
const LOG_WINDOW_BLOCKS = 10_000
const MIN_LOG_WINDOW_BLOCKS = 1_000
// Recently queued txs are the common case: walk back this many windows before bisecting
const RECENT_WINDOWS = 3

// Past any reorg on record (deepest ever 7 blocks, 1 since the Merge). A log shallower than this
// can still be replaced, and the cached arguments would then make executeNextTx revert.
const REORG_DEPTH_BLOCKS = 12

/** Everything a read against one Delay Modifier needs. */
type DelayModifierContext = {
  delayModifier: Delay
  delayModifierAddress: string
  provider: JsonRpcProvider
  chainId: string
}

/** The Delay Modifier's configuration and nonces, as one multicall reads them. */
type DelayModifierConfig = {
  recoverers: Array<string>
  expiry: bigint
  delay: bigint
  txNonce: bigint
  queueNonce: bigint
}

type AddedTransactionTopics = Array<string | Array<string> | null>

/** Logs from one window, and the furthest block it reached. */
type WindowRead = { events: Array<AddedEvent>; reached: number }

export const _addedTransactionsCache = new Map<string, AddedEvent>()

const getCacheKey = (chainId: string, delayModifierAddress: string, nonce: bigint) =>
  `${chainId}:${delayModifierAddress.toLowerCase()}:${nonce}`

/**
 * Reads TransactionAdded logs one window at a time. The window halves whenever the RPC rejects the
 * range, and stays narrowed afterwards, so a node with a lower cap than our default still works.
 */
const createLogWindowReader = (delayModifier: Delay, topics: AddedTransactionTopics) => {
  let windowSize = LOG_WINDOW_BLOCKS

  const narrow = () => {
    if (windowSize <= MIN_LOG_WINDOW_BLOCKS) {
      return false
    }
    windowSize = Math.floor(windowSize / 2)
    return true
  }

  const read = async (fromBlock: number, toBlock: number): Promise<Array<AddedEvent>> =>
    // Zodiac's typings don't cover a raw topic array, which is how we filter by nonce
    // @ts-expect-error
    delayModifier.queryFilter(topics, fromBlock, toBlock)

  return {
    /** Reads the window ending at `toBlock`, not reaching below `floor`. */
    async readDownFrom(toBlock: number, floor: number): Promise<WindowRead> {
      while (true) {
        const fromBlock = Math.max(toBlock - windowSize + 1, floor)
        try {
          return { events: await read(fromBlock, toBlock), reached: fromBlock }
        } catch (error) {
          if (!narrow()) throw error
        }
      }
    },

    /** Reads the window starting at `fromBlock`, not reaching above `ceiling`. */
    async readUpFrom(fromBlock: number, ceiling: number): Promise<WindowRead> {
      while (true) {
        const toBlock = Math.min(fromBlock + windowSize - 1, ceiling)
        try {
          return { events: await read(fromBlock, toBlock), reached: toBlock }
        } catch (error) {
          if (!narrow()) throw error
        }
      }
    },
  }
}

type LogWindowReader = ReturnType<typeof createLogWindowReader>
type IsDone = (events: Array<AddedEvent>) => boolean

/** The common case: a recently queued tx sits within a few windows of the chain head. */
const scanRecentBlocks = async (
  reader: LogWindowReader,
  latestBlock: number,
  isDone: IsDone,
): Promise<{ events: Array<AddedEvent>; oldestUnscanned: number }> => {
  const events: Array<AddedEvent> = []
  let toBlock = latestBlock

  for (let window = 0; window < RECENT_WINDOWS && toBlock >= 0 && !isDone(events); window++) {
    const read = await reader.readDownFrom(toBlock, 0)
    events.push(...read.events)
    toBlock = read.reached - 1
  }

  return { events, oldestUnscanned: toBlock }
}

/** Anything older: scan forward from where it was queued rather than everything in between. */
const scanFrom = async (
  reader: LogWindowReader,
  fromBlock: number,
  toBlock: number,
  isDone: IsDone,
): Promise<Array<AddedEvent>> => {
  const events: Array<AddedEvent> = []
  let nextBlock = fromBlock

  while (nextBlock <= toBlock && !isDone(events)) {
    const read = await reader.readUpFrom(nextBlock, toBlock)
    events.push(...read.events)
    nextBlock = read.reached + 1
  }

  return events
}

/** First block mined at or after `timestamp`, found by bisecting [0, upperBound]. */
const findBlockAtTimestamp = async (provider: JsonRpcProvider, timestamp: number, upperBound: number) => {
  let low = 0
  let high = upperBound

  while (low < high) {
    const mid = Math.floor((low + high) / 2)
    const block = await provider.getBlock(mid)

    if (!block) {
      throw new Error(`Could not fetch block ${mid}`)
    }

    if (block.timestamp < timestamp) {
      low = mid + 1
    } else {
      high = mid
    }
  }

  return low
}

/** Block the given nonce was queued in. Every missing event was emitted at or after it. */
const findQueuedBlock = async (
  { delayModifier, provider }: DelayModifierContext,
  nonce: bigint,
  upperBound: number,
): Promise<number> => {
  const createdAt = await delayModifier.txCreatedAt(nonce)

  if (createdAt === BigInt(0)) {
    throw new Error(`Could not determine when recovery ${nonce} was queued`)
  }

  return findBlockAtTimestamp(provider, Number(createdAt), upperBound)
}

const findAddedTransactions = async (
  context: DelayModifierContext,
  topics: AddedTransactionTopics,
  missingNonces: Array<bigint>,
  latestBlock: number,
): Promise<Array<AddedEvent>> => {
  const reader = createLogWindowReader(context.delayModifier, topics)
  const isDone: IsDone = (events) => events.length >= missingNonces.length

  const recent = await scanRecentBlocks(reader, latestBlock, isDone)
  if (isDone(recent.events) || recent.oldestUnscanned < 0) {
    return recent.events
  }

  const queuedAt = await findQueuedBlock(context, missingNonces[0], recent.oldestUnscanned)
  const older = await scanFrom(reader, queuedAt, recent.oldestUnscanned, isDone)

  return [...recent.events, ...older]
}

const splitCachedNonces = (
  { chainId, delayModifierAddress }: DelayModifierContext,
  { txNonce, queueNonce }: Pick<DelayModifierConfig, 'txNonce' | 'queueNonce'>,
) => {
  const cached: Array<AddedEvent> = []
  const missing: Array<bigint> = []

  for (let nonce = txNonce; nonce < queueNonce; nonce++) {
    const event = _addedTransactionsCache.get(getCacheKey(chainId, delayModifierAddress, nonce))
    if (event) {
      cached.push(event)
    } else {
      missing.push(nonce)
    }
  }

  return { cached, missing }
}

const cacheSettledEvents = (
  { chainId, delayModifierAddress }: DelayModifierContext,
  events: Array<AddedEvent>,
  latestBlock: number,
) => {
  for (const event of events) {
    if (!event.removed && latestBlock - event.blockNumber >= REORG_DEPTH_BLOCKS) {
      _addedTransactionsCache.set(getCacheKey(chainId, delayModifierAddress, event.args.queueNonce), event)
    }
  }
}

/** Topic filter for TransactionAdded, narrowed to the nonces we still need. */
const getAddedTransactionTopics = async (
  delayModifier: Delay,
  nonces: Array<bigint>,
): Promise<AddedTransactionTopics> => {
  const filter = delayModifier.filters.TransactionAdded() as TransactionAddedEvent.Filter
  const topics = await filter.getTopicFilter()
  topics[1] = nonces.map((nonce) => toBeHex(nonce, 32))

  return topics
}

const queryAddedTransactions = async (
  context: DelayModifierContext,
  config: DelayModifierConfig,
): Promise<Array<AddedEvent>> => {
  if (config.queueNonce === config.txNonce) {
    // There are no queued txs
    return []
  }

  const { cached, missing } = splitCachedNonces(context, config)
  if (missing.length === 0) {
    return cached
  }

  const topics = await getAddedTransactionTopics(context.delayModifier, missing)
  const latestBlock = await context.provider.getBlockNumber()
  const found = await findAddedTransactions(context, topics, missing, latestBlock)

  cacheSettledEvents(context, found, latestBlock)

  return [...cached, ...found]
}

const getRecoveryQueueItem = async ({
  delayModifier,
  transactionAdded,
  delay,
  expiry,
  provider,
  chainId,
  version,
  safeAddress,
}: {
  delayModifier: Delay
  transactionAdded: AddedEvent
  delay: bigint
  expiry: bigint
  provider: JsonRpcProvider
  chainId: string
  version: SafeState['version']
  safeAddress: string
}): Promise<RecoveryQueueItem> => {
  const [timestamps, receipt] = await Promise.all([
    _getRecoveryQueueItemTimestamps({
      delayModifier,
      transactionAdded,
      delay,
      expiry,
    }),
    provider.getTransactionReceipt(transactionAdded.transactionHash),
  ])

  const isMalicious = _isMaliciousRecovery({
    chainId,
    version,
    safeAddress,
    transaction: transactionAdded.args,
  })

  if (!receipt) {
    throw new Error(`Could not fetch transaction receipt for ${transactionAdded.transactionHash}`)
  }

  return {
    ...transactionAdded,
    ...timestamps,
    isMalicious,
    executor: receipt.from,
  }
}

/** Reads the Delay Modifier's configuration and nonces in a single multicall. */
const readDelayModifierConfig = async ({
  delayModifier,
  delayModifierAddress,
  provider,
}: DelayModifierContext): Promise<DelayModifierConfig> => {
  const abi = delayModifier.interface
  const call = (data: string) => ({ to: delayModifierAddress, data })

  const [modules, expiry, delay, txNonce, queueNonce] = await multicall(provider, [
    call(abi.encodeFunctionData('getModulesPaginated', [SENTINEL_ADDRESS, MAX_RECOVERER_PAGE_SIZE])),
    call(abi.encodeFunctionData('txExpiration')),
    call(abi.encodeFunctionData('txCooldown')),
    call(abi.encodeFunctionData('txNonce')),
    call(abi.encodeFunctionData('queueNonce')),
  ])

  const [recoverers] = abi.decodeFunctionResult('getModulesPaginated', modules.returnData) as unknown as [
    Array<string>,
    string,
  ]

  return {
    recoverers,
    expiry: BigInt(expiry.returnData),
    delay: BigInt(delay.returnData),
    txNonce: BigInt(txNonce.returnData),
    queueNonce: BigInt(queueNonce.returnData),
  }
}

/** What reading recovery state needs, beyond the Delay Modifier itself. */
type RecoveryStateQuery = {
  safeAddress: string
  provider: JsonRpcProvider
  chainId: string
  version: SafeState['version']
}

export const _getRecoveryStateItem = async ({
  delayModifier,
  safeAddress,
  provider,
  chainId,
  version,
}: RecoveryStateQuery & { delayModifier: Delay }): Promise<RecoveryStateItem> => {
  const context: DelayModifierContext = {
    delayModifier,
    delayModifierAddress: await delayModifier.getAddress(),
    provider,
    chainId,
  }

  const config = await readDelayModifierConfig(context)
  const transactionsAdded = await queryAddedTransactions(context, config)

  const queue = await Promise.all(
    transactionsAdded.map((transactionAdded) =>
      getRecoveryQueueItem({
        delayModifier,
        transactionAdded,
        delay: config.delay,
        expiry: config.expiry,
        provider,
        chainId,
        version,
        safeAddress,
      }),
    ),
  )

  return {
    ...config,
    address: context.delayModifierAddress,
    queue: queue.filter((item) => !item.removed),
  }
}

export function getRecoveryState({
  delayModifiers,
  ...query
}: RecoveryStateQuery & { delayModifiers: Array<Delay> }): Promise<RecoveryState> {
  return Promise.all(delayModifiers.map((delayModifier) => _getRecoveryStateItem({ delayModifier, ...query })))
}
