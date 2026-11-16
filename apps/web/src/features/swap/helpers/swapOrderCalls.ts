import type { SwapOrderTransactionInfo, TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Interface } from 'ethers'
import { decodeMultiSendData } from '@safe-global/protocol-kit'
import { type SupportedChainId, WRAPPED_NATIVE_CURRENCIES } from '@cowprotocol/cow-sdk'
import { OperationType } from '@safe-global/types-kit'
import {
  APPROVAL_SIGNATURE_HASH,
  ERC20_INTERFACE,
} from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import { isMultiSendCalldata } from '@/utils/transaction-calldata'
import { PRE_SIGN_SIGHASH, WRAP_SIGHASH } from './utils'

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

const isCowSupportedChainId = (chainId: number): chainId is SupportedChainId => chainId in WRAPPED_NATIVE_CURRENCIES

const getWrappedNativeAddress = (chainId: string): string | undefined => {
  const id = Number(chainId)
  return isCowSupportedChainId(id) ? WRAPPED_NATIVE_CURRENCIES[id].address : undefined
}

const isWrapOfSellToken = (call: BatchCall, order: DisplayedOrder, chainId: string): boolean => {
  const wrappedNative = getWrappedNativeAddress(chainId)
  return (
    getSelector(call.data) === WRAP_SIGHASH &&
    wrappedNative !== undefined &&
    isSameAddress(call.to, wrappedNative) &&
    isSameAddress(call.to, order.sellToken.address)
  )
}

const isOrderCall = (call: BatchCall, order: DisplayedOrder, deployment?: CowDeployment): boolean => {
  if (BigInt(call.value || '0') !== 0n || !deployment) return false

  const selector = getSelector(call.data)
  if (selector === PRE_SIGN_SIGHASH) return isPresignatureOfOrder(call, deployment, order.uid)
  if (selector === APPROVAL_SIGNATURE_HASH) {
    return isSameAddress(call.to, order.sellToken.address) && isApprovalTo(call.data, deployment.vaultRelayer)
  }
  return false
}

const countCallsOutsideOrder = (calls: BatchCall[], order: DisplayedOrder, chainId: string): number => {
  const deployment = COW_DEPLOYMENTS.find((item) => calls.some((call) => isPresignatureOfOrder(call, item, order.uid)))
  let wrappedAmount = 0n

  return calls.filter((call) => {
    if (call.operation === OperationType.DelegateCall) return true

    if (isWrapOfSellToken(call, order, chainId)) {
      wrappedAmount += BigInt(call.value || '0')
      return wrappedAmount > BigInt(order.sellAmount)
    }

    return !isOrderCall(call, order, deployment)
  }).length
}

/**
 * Counts the calls of a swap order transaction that are not part of the displayed order: anything other than
 * its presignature, the sell token approval to the VaultRelayer of the same CoW deployment, or wraps of the
 * chain's wrapped native token (when it is the sell token) adding up to at most the sell amount.
 * A batch is only inspected when it is a delegate call to a trusted MultiSend, otherwise it counts as one call.
 */
export const countNonSwapOrderCalls = (
  txData: Pick<TransactionData, 'hexData' | 'to' | 'value' | 'operation' | 'trustedDelegateCallTarget'>,
  order: DisplayedOrder,
  chainId: string,
): number => {
  const { hexData } = txData
  if (!hexData) return 0

  if (!isMultiSendCalldata(hexData)) {
    const call = { to: txData.to.value, value: txData.value ?? '0', data: hexData, operation: txData.operation }
    return countCallsOutsideOrder([call], order, chainId)
  }

  if (txData.operation !== OperationType.DelegateCall || txData.trustedDelegateCallTarget !== true) return 1

  try {
    return countCallsOutsideOrder(decodeMultiSendData(hexData), order, chainId)
  } catch {
    return 1
  }
}
