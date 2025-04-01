import { SENTINEL_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import memoize from 'lodash/memoize'
import { getMultiSendCallOnlyDeployment } from '@safe-global/safe-deployments'
import type { SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import type { Delay } from '@gnosis.pm/zodiac'
import type { TransactionAddedEvent } from '@gnosis.pm/zodiac/dist/cjs/types/Delay'
import { toBeHex, type JsonRpcProvider, type TransactionReceipt } from 'ethers'
import { trimTrailingSlash } from '@/utils/url'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { isMultiSendCalldata } from '@/utils/transaction-calldata'
import { decodeMultiSendData } from '@safe-global/protocol-kit/dist/src/utils'

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
  version: SafeInfo['version']
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
    getMultiSendCallOnlyDeployment({ network: chainId, version: version ?? undefined }) ??
    getMultiSendCallOnlyDeployment({ network: chainId, version: BASE_MULTI_SEND_CALL_ONLY_VERSION })

  if (!multiSendDeployment) {
    return true
  }

  const multiSendAddress = multiSendDeployment.networkAddresses[chainId] ?? multiSendDeployment.defaultAddress

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

export const _getSafeCreationReceipt = memoize(
  async ({
    transactionService,
    safeAddress,
    provider,
  }: {
    transactionService: string
    safeAddress: string
    provider: JsonRpcProvider
  }): Promise<TransactionReceipt | null> => {
    const url = `${trimTrailingSlash(transactionService)}/api/v1/safes/${safeAddress}/creation/`

    const { transactionHash } = await fetch(url).then((res) => {
      if (res.ok && res.status === 200) {
        return res.json() as Promise<{ transactionHash: string } & unknown>
      } else {
        throw new Error('Error fetching Safe creation details')
      }
    })

    return provider.getTransactionReceipt(transactionHash)
  },
  ({ transactionService, safeAddress }) => transactionService + safeAddress,
)

const queryAddedTransactions = async (
  delayModifier: Delay,
  queueNonce: bigint,
  txNonce: bigint,
  transactionService: string,
  provider: JsonRpcProvider,
  safeAddress: string,
) => {
  if (queueNonce === txNonce) {
    // There are no queued txs
    return []
  }

  // We filter for the valid nonces while fetching the event logs.
  // The nonce has to be one between the current queueNonce and the txNonce.
  const diff = queueNonce - txNonce
  const queryNonces = Array.from({ length: Number(diff) }, (_, idx) => {
    return toBeHex(BigInt(txNonce + BigInt(idx)), 32)
  })

  const transactionAddedFilter = delayModifier.filters.TransactionAdded() as TransactionAddedEvent.Filter

  const topics = await transactionAddedFilter.getTopicFilter()
  topics[1] = queryNonces

  const { blockNumber } = (await _getSafeCreationReceipt({ transactionService, provider, safeAddress }))!

  // @ts-expect-error
  return await delayModifier.queryFilter(topics, blockNumber, 'latest')
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
  version: SafeInfo['version']
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

  return {
    ...transactionAdded,
    ...timestamps,
    isMalicious,
    executor: receipt!.from,
  }
}

export const _getRecoveryStateItem = async ({
  delayModifier,
  transactionService,
  safeAddress,
  provider,
  chainId,
  version,
}: {
  delayModifier: Delay
  transactionService: string
  safeAddress: string
  provider: JsonRpcProvider
  chainId: string
  version: SafeInfo['version']
}): Promise<RecoveryStateItem> => {
  const [[recoverers], expiry, delay, txNonce, queueNonce] = await Promise.all([
    delayModifier.getModulesPaginated(SENTINEL_ADDRESS, MAX_RECOVERER_PAGE_SIZE),
    delayModifier.txExpiration(),
    delayModifier.txCooldown(),
    delayModifier.txNonce(),
    delayModifier.queueNonce(),
  ])

  const queuedTransactionsAdded = await queryAddedTransactions(
    delayModifier,
    BigInt(queueNonce),
    BigInt(txNonce),
    transactionService,
    provider,
    safeAddress,
  )

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
  transactionService: string
  safeAddress: string
  provider: JsonRpcProvider
  chainId: string
  version: SafeInfo['version']
}): Promise<RecoveryState> {
  return Promise.all(delayModifiers.map((delayModifier) => _getRecoveryStateItem({ delayModifier, ...rest })))
}
