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
const LOG_QUERY_BLOCK_RANGE = 10_000
const MIN_LOG_QUERY_BLOCK_RANGE = 1_000
// Recently queued txs are the common case: walk back this many windows before bisecting
const RECENT_WINDOWS = 3

// Past any reorg on record (deepest ever 7 blocks, 1 since the Merge). A log shallower than this
// can still be replaced, and the cached arguments would then make executeNextTx revert.
const REORG_DEPTH_BLOCKS = 12

export const _addedTransactionsCache = new Map<string, AddedEvent>()

const getCacheKey = (chainId: string, delayModifierAddress: string, nonce: bigint) =>
  `${chainId}:${delayModifierAddress.toLowerCase()}:${nonce}`

// First block mined at or after `timestamp`, found by bisecting [0, upperBound]
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

const scanAddedTransactions = async ({
  delayModifier,
  provider,
  topics,
  missingNonces,
  latestBlock,
}: {
  delayModifier: Delay
  provider: JsonRpcProvider
  topics: Array<string | Array<string> | null>
  missingNonces: Array<bigint>
  latestBlock: number
}): Promise<Array<AddedEvent>> => {
  const events: Array<AddedEvent> = []
  const isComplete = () => events.length >= missingNonces.length
  let range = LOG_QUERY_BLOCK_RANGE

  // Returns false after halving the window so the caller recomputes its bounds
  const queryWindow = async (fromBlock: number, toBlock: number): Promise<boolean> => {
    try {
      // @ts-expect-error
      const chunk: Array<AddedEvent> = await delayModifier.queryFilter(topics, fromBlock, toBlock)
      events.push(...chunk)
      return true
    } catch (error) {
      if (range <= MIN_LOG_QUERY_BLOCK_RANGE) {
        throw error
      }
      range = Math.floor(range / 2)
      return false
    }
  }

  let toBlock = latestBlock
  let windows = 0
  while (toBlock >= 0 && windows < RECENT_WINDOWS && !isComplete()) {
    const fromBlock = Math.max(toBlock - range + 1, 0)
    if (await queryWindow(fromBlock, toBlock)) {
      toBlock = fromBlock - 1
      windows++
    }
  }

  if (isComplete() || toBlock < 0) {
    return events
  }

  // Every missing event was emitted at or after the oldest missing nonce was queued
  const createdAt = await delayModifier.txCreatedAt(missingNonces[0])
  if (createdAt === BigInt(0)) {
    throw new Error(`Could not determine when recovery ${missingNonces[0]} was queued`)
  }

  let fromBlock = await findBlockAtTimestamp(provider, Number(createdAt), toBlock)
  while (fromBlock <= toBlock && !isComplete()) {
    const windowEnd = Math.min(fromBlock + range - 1, toBlock)
    if (await queryWindow(fromBlock, windowEnd)) {
      fromBlock = windowEnd + 1
    }
  }

  return events
}

const queryAddedTransactions = async ({
  delayModifier,
  delayModifierAddress,
  queueNonce,
  txNonce,
  provider,
  chainId,
}: {
  delayModifier: Delay
  delayModifierAddress: string
  queueNonce: bigint
  txNonce: bigint
  provider: JsonRpcProvider
  chainId: string
}): Promise<Array<AddedEvent>> => {
  if (queueNonce === txNonce) {
    // There are no queued txs
    return []
  }

  // We filter for the valid nonces while fetching the event logs.
  // The nonce has to be one between the current queueNonce and the txNonce.
  const cached: Array<AddedEvent> = []
  const missingNonces: Array<bigint> = []
  for (let nonce = txNonce; nonce < queueNonce; nonce++) {
    const event = _addedTransactionsCache.get(getCacheKey(chainId, delayModifierAddress, nonce))
    if (event) {
      cached.push(event)
    } else {
      missingNonces.push(nonce)
    }
  }

  if (missingNonces.length === 0) {
    return cached
  }

  const transactionAddedFilter = delayModifier.filters.TransactionAdded() as TransactionAddedEvent.Filter

  const topics = await transactionAddedFilter.getTopicFilter()
  topics[1] = missingNonces.map((nonce) => toBeHex(nonce, 32))

  const latestBlock = await provider.getBlockNumber()
  const events = await scanAddedTransactions({ delayModifier, provider, topics, missingNonces, latestBlock })

  for (const event of events) {
    if (!event.removed && latestBlock - event.blockNumber >= REORG_DEPTH_BLOCKS) {
      _addedTransactionsCache.set(getCacheKey(chainId, delayModifierAddress, event.args.queueNonce), event)
    }
  }

  return [...cached, ...events]
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

export const _getRecoveryStateItem = async ({
  delayModifier,
  safeAddress,
  provider,
  chainId,
  version,
}: {
  delayModifier: Delay
  safeAddress: string
  provider: JsonRpcProvider
  chainId: string
  version: SafeState['version']
}): Promise<RecoveryStateItem> => {
  const delayModifierAddress = await delayModifier.getAddress()
  const calls = [
    {
      to: delayModifierAddress,
      data: delayModifier.interface.encodeFunctionData('getModulesPaginated', [
        SENTINEL_ADDRESS,
        MAX_RECOVERER_PAGE_SIZE,
      ]),
    },
    {
      to: delayModifierAddress,
      data: delayModifier.interface.encodeFunctionData('txExpiration'),
    },
    {
      to: delayModifierAddress,
      data: delayModifier.interface.encodeFunctionData('txCooldown'),
    },
    {
      to: delayModifierAddress,
      data: delayModifier.interface.encodeFunctionData('txNonce'),
    },
    {
      to: delayModifierAddress,
      data: delayModifier.interface.encodeFunctionData('queueNonce'),
    },
  ]
  const callResults = await multicall(provider, calls)

  const [[recoverers], expiry, delay, txNonce, queueNonce] = [
    delayModifier.interface.decodeFunctionResult('getModulesPaginated', callResults[0].returnData) as unknown as [
      string[],
      string,
    ],
    BigInt(callResults[1].returnData),
    BigInt(callResults[2].returnData),
    BigInt(callResults[3].returnData),
    BigInt(callResults[4].returnData),
  ]

  const queuedTransactionsAdded = await queryAddedTransactions({
    delayModifier,
    delayModifierAddress,
    queueNonce,
    txNonce,
    provider,
    chainId,
  })

  const queue = await Promise.all(
    queuedTransactionsAdded.map((transactionAdded) => {
      return getRecoveryQueueItem({
        delayModifier,
        transactionAdded,
        delay: BigInt(delay),
        expiry: BigInt(expiry),
        provider,
        chainId,
        version,
        safeAddress,
      })
    }),
  )

  return {
    address: await delayModifier.getAddress(),
    recoverers,
    expiry: BigInt(expiry),
    delay: BigInt(delay),
    txNonce: BigInt(txNonce),
    queueNonce: BigInt(queueNonce),
    queue: queue.filter((item) => !item.removed),
  }
}

export function getRecoveryState({
  delayModifiers,
  ...rest
}: {
  delayModifiers: Array<Delay>
  safeAddress: string
  provider: JsonRpcProvider
  chainId: string
  version: SafeState['version']
}): Promise<RecoveryState> {
  return Promise.all(delayModifiers.map((delayModifier) => _getRecoveryStateItem({ delayModifier, ...rest })))
}
