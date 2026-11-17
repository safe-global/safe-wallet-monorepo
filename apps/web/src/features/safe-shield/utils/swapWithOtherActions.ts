import { id, Interface } from 'ethers'
import { decodeMultiSendData } from '@safe-global/protocol-kit'
import { OperationType, type SafeTransaction } from '@safe-global/types-kit'
import { getMultiSendCallOnlyDeployments, getMultiSendDeployments } from '@safe-global/safe-deployments'
import {
  APPROVAL_SIGNATURE_HASH,
  ERC20_INTERFACE,
} from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import { type AnalysisResult, Severity, ThreatStatus } from '@safe-global/utils/features/safe-shield/types'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { hasMatchingDeployment, TRUSTED_DEPLOYMENT_VERSIONS } from '@safe-global/utils/services/contracts/deployments'
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

// WRAPPED_NATIVE_CURRENCIES of @cowprotocol/sdk-config, copied to keep the CoW SDK out of the global bundle
export const WRAPPED_NATIVE_TOKENS: Record<string, string> = {
  '1': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  '56': '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  '100': '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d',
  '137': '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
  '8453': '0x4200000000000000000000000000000000000006',
  '9745': '0x6100e367285b01f48d07953803a2d8dca5d19873',
  '42161': '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  '43114': '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
  '57073': '0x4200000000000000000000000000000000000006',
  '59144': '0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f',
  '11155111': '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
}

const PRE_SIGN_SELECTOR = id('setPreSignature(bytes,bool)').slice(0, 10)
const WRAP_SELECTOR = id('deposit()').slice(0, 10)
const SETTLEMENT_INTERFACE = new Interface(['function setPreSignature(bytes orderUid, bool signed)'])

type CowDeployment = (typeof COW_DEPLOYMENTS)[number]
type Call = { to: string; value: string; data: string; operation?: OperationType }

export type SwapWithOtherActionsResult = AnalysisResult<ThreatStatus.SWAP_WITH_OTHER_ACTIONS>

const isSameAddress = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()
const getSelector = (data: string) => data.slice(0, 10).toLowerCase()
const isPlainCall = (call: Call) => call.operation !== OperationType.DelegateCall && BigInt(call.value || '0') === 0n

const decodePresignature = (call: Call): { signed: boolean } | undefined => {
  if (getSelector(call.data) !== PRE_SIGN_SELECTOR) return undefined
  try {
    const [, signed] = SETTLEMENT_INTERFACE.decodeFunctionData('setPreSignature', call.data)
    return { signed: signed === true }
  } catch {
    return undefined
  }
}

const isOrderPresignature = (call: Call, deployment: CowDeployment): boolean =>
  isPlainCall(call) && isSameAddress(call.to, deployment.settlement) && decodePresignature(call)?.signed === true

const isApprovalTo = (call: Call, spender: string): boolean => {
  if (!isPlainCall(call) || getSelector(call.data) !== APPROVAL_SIGNATURE_HASH) return false
  try {
    const [approved] = ERC20_INTERFACE.decodeFunctionData('approve', call.data)
    return isSameAddress(approved, spender)
  } catch {
    return false
  }
}

const isWrapOfNativeToken = (call: Call, chainId: string): boolean => {
  const wrappedNativeToken = WRAPPED_NATIVE_TOKENS[chainId]
  if (!wrappedNativeToken || call.operation === OperationType.DelegateCall) return false
  return getSelector(call.data) === WRAP_SELECTOR && isSameAddress(call.to, wrappedNativeToken)
}

const isOfficialMultiSend = (address: string, chainId: string): boolean =>
  hasMatchingDeployment(getMultiSendCallOnlyDeployments, address, chainId, TRUSTED_DEPLOYMENT_VERSIONS) ||
  hasMatchingDeployment(getMultiSendDeployments, address, chainId, TRUSTED_DEPLOYMENT_VERSIONS)

const decodeBatch = (data: string): Call[] | undefined => {
  try {
    return decodeMultiSendData(data)
  } catch {
    return undefined
  }
}

/**
 * The calls the transaction executes, and the calls to look for a presignature in. A MultiSend payload only runs as a
 * batch when an official MultiSend is delegate called; otherwise it counts as a single call, even with a presignature.
 */
const getCalls = (safeTx: SafeTransaction, chainId: string): { executed: Call[]; inspected: Call[] } | undefined => {
  const { to, value, data, operation } = safeTx.data
  const outer = [{ to, value, data, operation }]
  if (!isMultiSendCalldata(data)) return { executed: outer, inspected: outer }

  const inner = decodeBatch(data)
  if (!inner) return undefined
  const isBatch = operation === OperationType.DelegateCall && isOfficialMultiSend(to, chainId)
  return { executed: isBatch ? inner : outer, inspected: inner }
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

  const calls = getCalls(safeTx, chainId)
  if (!calls?.inspected.some((call) => decodePresignature(call)?.signed)) return undefined

  const otherActions = countCallsOutsideOrder(calls.executed, chainId)
  if (otherActions === 0) return undefined

  return {
    severity: Severity.WARN,
    type: ThreatStatus.SWAP_WITH_OTHER_ACTIONS,
    title: 'Swap bundled with other actions',
    description: `This transaction places a swap order and also contains ${otherActions} other action${maybePlural(otherActions)} that may move funds, such as transfers. Review every action before you sign.`,
  }
}
