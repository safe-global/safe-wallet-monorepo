import type {
  DataDecoded,
  SwapOrderTransactionInfo,
  TransactionData,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import { formatUnits, id, Interface } from 'ethers'
import type { AnyAppDataDocVersion, cowAppDataLatestScheme as latest } from '@cowprotocol/sdk-app-data'
import type { OnTradeParamsPayload } from '@cowprotocol/events'
import type { BaseTransaction } from '@safe-global/safe-apps-sdk'
import { decodeMultiSendData } from '@safe-global/protocol-kit'
import { OperationType } from '@safe-global/types-kit'
import {
  APPROVAL_SIGNATURE_HASH,
  ERC20_INTERFACE,
} from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import { isMultiSendCalldata } from '@/utils/transaction-calldata'

import { TradeType, UiOrderType } from '@safe-global/utils/features/swap/types'
import { LIMIT_ORDER_TITLE, SWAP_ORDER_TITLE, TWAP_ORDER_TITLE } from '../constants'
import type { SwapState } from '../store/swapParamsSlice'

type Quantity = {
  amount: string | number | bigint
  decimals: number
}

export enum OrderKind {
  SELL = 'sell',
  BUY = 'buy',
}

function calculateDifference(amountA: string, amountB: string, decimals: number): number {
  return asDecimal(BigInt(amountA), decimals) - asDecimal(BigInt(amountB), decimals)
}

function asDecimal(amount: number | bigint, decimals: number): number {
  return Number(formatUnits(amount, decimals))
}

export const TWAP_FALLBACK_HANDLER = '0x2f55e8b20D0B9FEFA187AA7d00B6Cbe563605bF5'

// https://github.com/cowprotocol/composable-cow/blob/main/networks.json
export const TWAP_FALLBACK_HANDLER_NETWORKS = [
  '1',
  '100',
  '137',
  '11155111',
  '8453',
  '42161',
  '43114',
  '232',
  '59144',
  '9745',
  '57073',
]

export const getExecutionPrice = (
  order: Pick<OrderTransactionInfo, 'executedSellAmount' | 'executedBuyAmount' | 'buyToken' | 'sellToken'>,
): number => {
  const { executedSellAmount, executedBuyAmount, buyToken, sellToken } = order

  const ratio = calculateRatio(
    { amount: executedSellAmount || '0', decimals: sellToken.decimals },
    {
      amount: executedBuyAmount || '0',
      decimals: buyToken.decimals,
    },
  )

  return ratio
}

export const getLimitPrice = (
  order: Pick<SwapOrderTransactionInfo, 'sellAmount' | 'buyAmount' | 'buyToken' | 'sellToken'>,
): number => {
  const { sellAmount, buyAmount, buyToken, sellToken } = order

  const ratio = calculateRatio(
    { amount: sellAmount, decimals: sellToken.decimals },
    { amount: buyAmount, decimals: buyToken.decimals },
  )

  return ratio
}

const calculateRatio = (a: Quantity, b: Quantity) => {
  if (BigInt(b.amount) === 0n) {
    return 0
  }
  return asDecimal(BigInt(a.amount), a.decimals) / asDecimal(BigInt(b.amount), b.decimals)
}

export const getSurplusPrice = (
  order: Pick<
    OrderTransactionInfo,
    'executedBuyAmount' | 'buyAmount' | 'buyToken' | 'executedSellAmount' | 'sellAmount' | 'sellToken' | 'kind'
  >,
): number => {
  const { kind, executedSellAmount, sellAmount, sellToken, executedBuyAmount, buyAmount, buyToken } = order
  if (kind === OrderKind.BUY) {
    return calculateDifference(sellAmount, executedSellAmount || '', sellToken.decimals)
  } else if (kind === OrderKind.SELL) {
    return calculateDifference(executedBuyAmount || '', buyAmount, buyToken.decimals)
  } else {
    return 0
  }
}

export const getPartiallyFilledSurplus = (order: OrderTransactionInfo): number => {
  if (order.kind === OrderKind.BUY) {
    return getPartiallyFilledBuySurplus(order)
  } else if (order.kind === OrderKind.SELL) {
    return getPartiallyFilledSellSurplus(order)
  } else {
    return 0
  }
}

const getPartiallyFilledBuySurplus = (
  order: Pick<
    OrderTransactionInfo,
    'executedBuyAmount' | 'buyAmount' | 'buyToken' | 'executedSellAmount' | 'sellAmount' | 'sellToken' | 'kind'
  >,
): number => {
  const { executedSellAmount, sellAmount, sellToken, executedBuyAmount, buyAmount, buyToken } = order

  const limitPrice = calculateRatio(
    { amount: sellAmount, decimals: sellToken.decimals },
    { amount: buyAmount, decimals: buyToken.decimals },
  )
  const maximumSellAmount = asDecimal(BigInt(executedBuyAmount || 0n), buyToken.decimals) * limitPrice
  return maximumSellAmount - asDecimal(BigInt(executedSellAmount || 0n), sellToken.decimals)
}

const getPartiallyFilledSellSurplus = (
  order: Pick<
    OrderTransactionInfo,
    'executedBuyAmount' | 'buyAmount' | 'buyToken' | 'executedSellAmount' | 'sellAmount' | 'sellToken' | 'kind'
  >,
): number => {
  const { executedSellAmount, sellAmount, sellToken, executedBuyAmount, buyAmount, buyToken } = order

  const limitPrice = calculateRatio(
    { amount: buyAmount, decimals: buyToken.decimals },
    { amount: sellAmount, decimals: sellToken.decimals },
  )

  const minimumBuyAmount = asDecimal(BigInt(executedSellAmount || 0n), sellToken.decimals) * limitPrice
  return asDecimal(BigInt(executedBuyAmount || 0n), buyToken.decimals) - minimumBuyAmount
}

export const getFilledPercentage = (
  order: Pick<OrderTransactionInfo, 'executedBuyAmount' | 'kind' | 'buyAmount' | 'executedSellAmount' | 'sellAmount'>,
): string => {
  let executed: number
  let total: number

  if (order.kind === OrderKind.BUY) {
    executed = Number(order.executedBuyAmount)
    total = Number(order.buyAmount)
  } else if (order.kind === OrderKind.SELL) {
    executed = Number(order.executedSellAmount)
    total = Number(order.sellAmount)
  } else {
    return '0'
  }

  return ((executed / total) * 100).toFixed(0)
}

export const getFilledAmount = (
  order: Pick<OrderTransactionInfo, 'kind' | 'executedBuyAmount' | 'executedSellAmount' | 'buyToken' | 'sellToken'>,
): string => {
  if (order.kind === OrderKind.BUY) {
    return formatUnits(order.executedBuyAmount || 0n, order.buyToken.decimals)
  } else if (order.kind === OrderKind.SELL) {
    return formatUnits(order.executedSellAmount || 0n, order.sellToken.decimals)
  } else {
    return '0'
  }
}

export const getSlippageInPercent = (order: Pick<OrderTransactionInfo, 'fullAppData'>): string => {
  const fullAppData = order.fullAppData as AnyAppDataDocVersion
  const slippageBips = (fullAppData?.metadata?.quote as latest.Quote)?.slippageBips || 0

  return (Number(slippageBips) / 100).toFixed(2)
}

export const getOrderClass = (order: Pick<OrderTransactionInfo, 'fullAppData'>): latest.OrderClass1 => {
  const fullAppData = order.fullAppData as AnyAppDataDocVersion
  const orderClass = (fullAppData?.metadata?.orderClass as latest.OrderClass)?.orderClass

  return orderClass || 'market'
}

export const isOrderPartiallyFilled = (
  order: Pick<OrderTransactionInfo, 'executedBuyAmount' | 'executedSellAmount' | 'sellAmount' | 'buyAmount' | 'kind'>,
): boolean => {
  const executedBuyAmount = BigInt(order.executedBuyAmount || 0)
  const buyAmount = BigInt(order.buyAmount)
  const executedSellAmount = BigInt(order.executedSellAmount || 0)
  const sellAmount = BigInt(order.sellAmount)

  if (order.kind === OrderKind.BUY) {
    return executedBuyAmount !== 0n && executedBuyAmount < buyAmount
  }

  return BigInt(executedSellAmount) !== 0n && executedSellAmount < sellAmount
}

export const UiOrderTypeToOrderType = (orderType: UiOrderType): TradeType => {
  switch (orderType) {
    case UiOrderType.SWAP:
      return TradeType.SWAP
    case UiOrderType.LIMIT:
      return TradeType.LIMIT
    case UiOrderType.TWAP:
      return TradeType.ADVANCED
  }
}

/**
 * Normalizes a CoW widget `ON_CHANGE_TRADE_PARAMS` payload into the local swap representation.
 *
 * The widget's `orderType` is CoW's `UiOrderType` (which includes members we don't model, e.g.
 * `HOOKS`/`YIELD`); it is mapped to our local {@link UiOrderType} by value, falling back to `SWAP`
 * for anything unrecognized. Token addresses are optional in the payload and normalized to `''`
 * (the widget's "no asset" convention).
 */
export const parseCowTradeParams = (params: OnTradeParamsPayload) => ({
  uiOrderType: UiOrderType[params.orderType as keyof typeof UiOrderType] ?? UiOrderType.SWAP,
  sellAsset: params.sellToken?.address ?? '',
  buyAsset: params.buyToken?.address ?? '',
})

export const isSettingTwapFallbackHandler = (decodedData: DataDecoded) => {
  return (
    decodedData.parameters?.some(
      (item) =>
        Array.isArray(item?.valueDecoded) &&
        item.valueDecoded.some(
          (decoded) =>
            decoded.dataDecoded?.method === 'setFallbackHandler' &&
            decoded.dataDecoded.parameters?.some(
              (parameter) => parameter.name === 'handler' && parameter.value === TWAP_FALLBACK_HANDLER,
            ),
        ),
    ) || false
  )
}

// Signature hashes for getSwapTitle
const PRE_SIGN_SIGHASH = id('setPreSignature(bytes,bool)').slice(0, 10)
const WRAP_SIGHASH = id('deposit()').slice(0, 10)
const UNWRAP_SIGHASH = id('withdraw(uint256)').slice(0, 10)
const CREATE_WITH_CONTEXT_SIGHASH = id('createWithContext((address,bytes32,bytes),address,bytes,bool)').slice(0, 10)
const CANCEL_ORDER_SIGHASH = id('invalidateOrder(bytes)').slice(0, 10)

// CoW Protocol uses the same addresses on every chain, with a separate set for its staging environment
export const COW_DEPLOYMENTS = [
  {
    settlement: '0x9008D19f58AAbD9eD0D60971565AA8510560ab41',
    vaultRelayer: '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110',
  },
  {
    settlement: '0xf553d092b50bdcbddeD1A99aF2cA29FBE5E2CB13',
    vaultRelayer: '0xC7242d167563352E2BCA4d71C043fbe542DB8FB2',
  },
]

const SETTLEMENT_INTERFACE = new Interface(['function setPreSignature(bytes orderUid, bool signed)'])

type CowDeployment = (typeof COW_DEPLOYMENTS)[number]
type BatchCall = { to: string; value: string; data: string; operation?: OperationType }
type DisplayedOrder = Pick<SwapOrderTransactionInfo, 'uid' | 'sellToken' | 'sellAmount'>

const isSameAddress = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()
const getSelector = (data: string) => data.slice(0, 10).toLowerCase()

const isPresignatureOfOrder = (call: BatchCall, deployment: CowDeployment, orderUid: string): boolean => {
  if (getSelector(call.data) !== PRE_SIGN_SIGHASH || !isSameAddress(call.to, deployment.settlement)) return false
  try {
    const [uid, signed] = SETTLEMENT_INTERFACE.decodeFunctionData('setPreSignature', call.data)
    return signed === true && String(uid).toLowerCase() === orderUid.toLowerCase()
  } catch {
    return false
  }
}

const isApprovalTo = (data: string, spender: string): boolean => {
  try {
    const [approved] = ERC20_INTERFACE.decodeFunctionData('approve', data)
    return isSameAddress(approved, spender)
  } catch {
    return false
  }
}

const isPartOfSwapOrder = (call: BatchCall, order: DisplayedOrder, deployment?: CowDeployment): boolean => {
  if (call.operation === OperationType.DelegateCall) return false

  const selector = getSelector(call.data)
  const value = BigInt(call.value || '0')

  if (selector === WRAP_SIGHASH) {
    return isSameAddress(call.to, order.sellToken.address) && value <= BigInt(order.sellAmount)
  }
  if (value !== 0n || !deployment) return false
  if (selector === PRE_SIGN_SIGHASH) return isPresignatureOfOrder(call, deployment, order.uid)
  if (selector === APPROVAL_SIGNATURE_HASH) {
    return isSameAddress(call.to, order.sellToken.address) && isApprovalTo(call.data, deployment.vaultRelayer)
  }
  return false
}

const countCallsOutsideOrder = (calls: BatchCall[], order: DisplayedOrder): number => {
  const deployment = COW_DEPLOYMENTS.find((item) => calls.some((call) => isPresignatureOfOrder(call, item, order.uid)))
  return calls.filter((call) => !isPartOfSwapOrder(call, order, deployment)).length
}

/**
 * Counts the calls of a swap order transaction that are not part of the displayed order: anything other than
 * its presignature, the sell token approval to the VaultRelayer of the same CoW deployment or a wrap of at most
 * the sell amount. A batch is only inspected when it is a delegate call to a trusted MultiSend, otherwise it counts
 * as one call.
 */
export const countNonSwapOrderCalls = (
  txData: Pick<TransactionData, 'hexData' | 'to' | 'value' | 'operation' | 'trustedDelegateCallTarget'>,
  order: DisplayedOrder,
): number => {
  const { hexData } = txData
  if (!hexData) return 0

  if (!isMultiSendCalldata(hexData)) {
    const call = { to: txData.to.value, value: txData.value ?? '0', data: hexData, operation: txData.operation }
    return countCallsOutsideOrder([call], order)
  }

  if (txData.operation !== OperationType.DelegateCall || txData.trustedDelegateCallTarget !== true) return 1

  try {
    return countCallsOutsideOrder(decodeMultiSendData(hexData), order)
  } catch {
    return 1
  }
}

export const getSwapTitle = (tradeType: SwapState['tradeType'], txs: BaseTransaction[] | undefined) => {
  const hashToLabel: Record<string, string> = {
    [PRE_SIGN_SIGHASH]: tradeType === 'limit' ? LIMIT_ORDER_TITLE : SWAP_ORDER_TITLE,
    [APPROVAL_SIGNATURE_HASH]: 'Approve',
    [WRAP_SIGHASH]: 'Wrap',
    [UNWRAP_SIGHASH]: 'Unwrap',
    [CREATE_WITH_CONTEXT_SIGHASH]: TWAP_ORDER_TITLE,
    [CANCEL_ORDER_SIGHASH]: 'Cancel Order',
  }

  const swapTitle = txs
    ?.map((tx) => hashToLabel[tx.data.slice(0, 10)])
    .filter(Boolean)
    .join(' and ')

  return swapTitle
}
