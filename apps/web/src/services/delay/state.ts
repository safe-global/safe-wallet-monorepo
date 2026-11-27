import { SENTINEL_ADDRESS } from '@safe-global/utils/utils/constants'
import type { Delay } from '@gnosis.pm/zodiac'
import type { TransactionAddedEvent } from '@gnosis.pm/zodiac/dist/cjs/types/Delay'
import { toBeHex, type JsonRpcProvider } from 'ethers'
import { multicall } from '@safe-global/utils/utils/multicall'

export const MAX_MODULE_PAGE_SIZE = 100

type AddedEvent = TransactionAddedEvent.Log
export type DelayQueueItem = AddedEvent & {
  timestamp: bigint
  validFrom: bigint
  expiresAt: bigint | null
  executor: string
}

export type DelayState = {
  address: string
  modules: Array<string>
  expiry: bigint
  delay: bigint
  txNonce: bigint
  queueNonce: bigint
  queue: Array<DelayQueueItem>
}

export const getDelayQueueItemTimestamps = async ({
  delayModifier,
  transactionAdded,
  delay,
  expiry,
}: {
  delayModifier: Delay
  transactionAdded: AddedEvent
  delay: bigint
  expiry: bigint
}): Promise<Pick<DelayQueueItem, 'timestamp' | 'validFrom' | 'expiresAt'>> => {
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
  modules: Array<string>
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

const getDelayQueueItem = async ({
  delayModifier,
  transactionAdded,
  delay,
  expiry,
  provider,
}: {
  delayModifier: Delay
  transactionAdded: AddedEvent
  delay: bigint
  expiry: bigint
  provider: JsonRpcProvider
}): Promise<DelayQueueItem> => {
  const [timestamps, receipt] = await Promise.all([
    getDelayQueueItemTimestamps({
      delayModifier,
      transactionAdded,
      delay,
      expiry,
    }),
    provider.getTransactionReceipt(transactionAdded.transactionHash),
  ])

  if (!receipt) {
    throw new Error(`Could not fetch transaction receipt for ${transactionAdded.transactionHash}`)
  }

  return {
    ...transactionAdded,
    ...timestamps,
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

  const [moduleResult, expiry, delay, txNonce, queueNonce] = await multicall(provider, [
    call(abi.encodeFunctionData('getModulesPaginated', [SENTINEL_ADDRESS, MAX_MODULE_PAGE_SIZE])),
    call(abi.encodeFunctionData('txExpiration')),
    call(abi.encodeFunctionData('txCooldown')),
    call(abi.encodeFunctionData('txNonce')),
    call(abi.encodeFunctionData('queueNonce')),
  ])

  const [modules] = abi.decodeFunctionResult('getModulesPaginated', moduleResult.returnData) as unknown as [
    Array<string>,
    string,
  ]

  return {
    modules,
    expiry: BigInt(expiry.returnData),
    delay: BigInt(delay.returnData),
    txNonce: BigInt(txNonce.returnData),
    queueNonce: BigInt(queueNonce.returnData),
  }
}

/** What reading recovery state needs, beyond the Delay Modifier itself. */
type DelayStateQuery = {
  provider: JsonRpcProvider
  chainId: string
}

export const readDelayState = async ({
  delayModifier,
  provider,
  chainId,
}: DelayStateQuery & { delayModifier: Delay }): Promise<DelayState> => {
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
      getDelayQueueItem({
        delayModifier,
        transactionAdded,
        delay: config.delay,
        expiry: config.expiry,
        provider,
      }),
    ),
  )

  return {
    ...config,
    address: context.delayModifierAddress,
    queue: queue.filter((item) => !item.removed),
  }
}
