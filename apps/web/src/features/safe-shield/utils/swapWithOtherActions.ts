import { id, Interface } from 'ethers'
import { decodeMultiSendData } from '@safe-global/protocol-kit'
import { OperationType, type SafeTransaction } from '@safe-global/types-kit'
import { type SupportedChainId, WRAPPED_NATIVE_CURRENCIES } from '@cowprotocol/cow-sdk'
import {
  APPROVAL_SIGNATURE_HASH,
  ERC20_INTERFACE,
} from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import { type AnalysisResult, Severity, ThreatStatus } from '@safe-global/utils/features/safe-shield/types'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { isMultiSendCalldata } from '@/utils/transaction-calldata'

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

const PRE_SIGN_SELECTOR = id('setPreSignature(bytes,bool)').slice(0, 10)
const WRAP_SELECTOR = id('deposit()').slice(0, 10)
const SETTLEMENT_INTERFACE = new Interface(['function setPreSignature(bytes orderUid, bool signed)'])

type CowDeployment = (typeof COW_DEPLOYMENTS)[number]
type Call = { to: string; value: string; data: string; operation?: OperationType }

export type SwapWithOtherActionsResult = AnalysisResult<ThreatStatus.SWAP_WITH_OTHER_ACTIONS>

const isSameAddress = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()
const getSelector = (data: string) => data.slice(0, 10).toLowerCase()
const isPlainCall = (call: Call) => call.operation !== OperationType.DelegateCall && BigInt(call.value || '0') === 0n

const isOrderPresignature = (call: Call, deployment: CowDeployment): boolean => {
  if (!isPlainCall(call) || getSelector(call.data) !== PRE_SIGN_SELECTOR) return false
  if (!isSameAddress(call.to, deployment.settlement)) return false
  try {
    const [, signed] = SETTLEMENT_INTERFACE.decodeFunctionData('setPreSignature', call.data)
    return signed === true
  } catch {
    return false
  }
}

const isApprovalTo = (call: Call, spender: string): boolean => {
  if (!isPlainCall(call) || getSelector(call.data) !== APPROVAL_SIGNATURE_HASH) return false
  try {
    const [approved] = ERC20_INTERFACE.decodeFunctionData('approve', call.data)
    return isSameAddress(approved, spender)
  } catch {
    return false
  }
}

const isCowSupportedChainId = (chainId: number): chainId is SupportedChainId => chainId in WRAPPED_NATIVE_CURRENCIES

const isWrapOfNativeToken = (call: Call, chainId: string): boolean => {
  const id = Number(chainId)
  if (!isCowSupportedChainId(id) || call.operation === OperationType.DelegateCall) return false
  return getSelector(call.data) === WRAP_SELECTOR && isSameAddress(call.to, WRAPPED_NATIVE_CURRENCIES[id].address)
}

const decodeBatch = (data: string): Call[] | undefined => {
  try {
    return decodeMultiSendData(data)
  } catch {
    return undefined
  }
}

/**
 * The calls the transaction executes, and the calls to look for a presignature in. A MultiSend payload that is not
 * delegate called does not run as a batch, so it counts as a single call even when it carries a presignature.
 */
const getCalls = (safeTx: SafeTransaction): { executed: Call[]; inspected: Call[] } | undefined => {
  const { to, value, data, operation } = safeTx.data
  const outer = [{ to, value, data, operation }]
  if (!isMultiSendCalldata(data)) return { executed: outer, inspected: outer }

  const inner = decodeBatch(data)
  if (!inner) return undefined
  return { executed: operation === OperationType.DelegateCall ? inner : outer, inspected: inner }
}

const countCallsOutsideOrder = (calls: Call[], chainId: string): number => {
  const deployment = COW_DEPLOYMENTS.find((item) => calls.some((call) => isOrderPresignature(call, item)))
  let hasOrderPresignature = false

  return calls.filter((call) => {
    if (deployment && !hasOrderPresignature && isOrderPresignature(call, deployment)) {
      hasOrderPresignature = true
      return false
    }
    if (deployment && isApprovalTo(call, deployment.vaultRelayer)) return false
    return !isWrapOfNativeToken(call, chainId)
  }).length
}

/**
 * Flags a transaction that presigns a CoW swap order and also contains calls that are not part of placing it.
 * Part of the order are a single presignature sent to a CoW Settlement contract, approvals to the VaultRelayer
 * of the same deployment and wraps of the chain's native token. Everything else counts as another action.
 */
export const getSwapWithOtherActionsResult = (
  safeTx: SafeTransaction | undefined,
  chainId: string,
): SwapWithOtherActionsResult | undefined => {
  if (!safeTx?.data.data || !safeTx.data.data.toLowerCase().includes(PRE_SIGN_SELECTOR.slice(2))) return undefined

  const calls = getCalls(safeTx)
  if (!calls?.inspected.some((call) => getSelector(call.data) === PRE_SIGN_SELECTOR)) return undefined

  const otherActions = countCallsOutsideOrder(calls.executed, chainId)
  if (otherActions === 0) return undefined

  return {
    severity: Severity.WARN,
    type: ThreatStatus.SWAP_WITH_OTHER_ACTIONS,
    title: 'Swap bundled with other actions',
    description: `This transaction places a swap order and also contains ${otherActions} other action${maybePlural(otherActions)} that may move funds, such as transfers. Review every action before you sign.`,
  }
}
