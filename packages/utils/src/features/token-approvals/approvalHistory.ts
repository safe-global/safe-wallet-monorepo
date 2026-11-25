import { decodeMultiSendData } from '@safe-global/protocol-kit'
import { dataSlice, getAddress } from 'ethers'
import type {
  AddressInfo,
  Transaction,
  TransactionData,
  TransactionDetails,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import {
  APPROVAL_SIGNATURE_HASH,
  ERC20_INTERFACE,
  INCREASE_ALLOWANCE_SIGNATURE_HASH,
  MULTISEND_SIGNATURE_HASH,
} from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import { sameAddress } from '@safe-global/utils/utils/addresses'

export type ApprovalTokenInfo = AddressInfo & { symbol?: string | null; decimals?: number | null }

/** An ERC-20 approval call the Safe made, as found in its transaction history */
export type ApprovalRecord = {
  token: ApprovalTokenInfo
  spender: AddressInfo
  txHash: string | null
  timestamp: number
}

type Call = { to: string; data: string; operation: number }

const DECREASE_ALLOWANCE_SIGNATURE_HASH = ERC20_INTERFACE.getFunction('decreaseAllowance').selector

const APPROVAL_FUNCTIONS = {
  [APPROVAL_SIGNATURE_HASH]: 'approve',
  [INCREASE_ALLOWANCE_SIGNATURE_HASH]: 'increaseAllowance',
  [DECREASE_ALLOWANCE_SIGNATURE_HASH]: 'decreaseAllowance',
} as const

const NON_APPROVAL_TX_TYPES = new Set(['Creation', 'SettingsChange', 'Transfer'])
const CANDIDATE_METHODS = new Set([...Object.values(APPROVAL_FUNCTIONS), 'multiSend'])

const CALL = 0
const DELEGATE_CALL = 1

const APPROVAL_EVENT_TOPIC = ERC20_INTERFACE.getEvent('Approval').topicHash

/** A log as returned by `eth_getTransactionReceipt` */
export type RawLog = { address: string; topics: readonly string[] }

const isExecutedContractCall = (tx: Transaction): boolean =>
  tx.txStatus === 'SUCCESS' && !NON_APPROVAL_TX_TYPES.has(tx.txInfo.type)

/** Whether a history entry may hold an approval, so its details are worth fetching */
export const isApprovalCandidate = (tx: Transaction): boolean => {
  if (!isExecutedContractCall(tx)) {
    return false
  }
  const methodName = 'methodName' in tx.txInfo ? tx.txInfo.methodName : undefined
  // An undecoded call or a non-Custom type (e.g. a swap batch) can still carry an approval
  return !methodName || CANDIDATE_METHODS.has(methodName)
}

// The list entry doesn't say whether the call was a delegatecall, so any other contract call is checked by its events
export const needsEventCheck = (tx: Transaction): boolean => isExecutedContractCall(tx) && !isApprovalCandidate(tx)

// Only a delegatecalled MultiSend runs its actions as the Safe; a plain call runs them as MultiSend
const flattenCalls = (call: Call): Call[] => {
  if (call.operation !== DELEGATE_CALL || !call.data.startsWith(MULTISEND_SIGNATURE_HASH)) {
    return [call]
  }
  try {
    return decodeMultiSendData(call.data).flatMap((inner) =>
      flattenCalls({ to: inner.to, data: inner.data, operation: Number(inner.operation) }),
    )
  } catch {
    // Same selector but not MultiSend packing: one unreadable call must not fail the whole scan
    return [call]
  }
}

const getSelector = (data: string) => data.slice(0, 10).toLowerCase() as keyof typeof APPROVAL_FUNCTIONS

const findByAddress = <T>(index: Record<string, T> | null | undefined, address: string): T | undefined => {
  if (!index) return undefined
  return index[address] ?? Object.entries(index).find(([key]) => sameAddress(key, address))?.[1]
}

const lookupAddressInfo = (txData: TransactionData, address: string): AddressInfo => {
  const value = getAddress(address)
  const info = findByAddress(txData.addressInfoIndex, value) ?? (sameAddress(txData.to.value, value) ? txData.to : {})
  return { ...info, value }
}

const lookupTokenInfo = (txData: TransactionData, address: string): ApprovalTokenInfo => {
  const info = lookupAddressInfo(txData, address)
  const tokenInfo = findByAddress(txData.tokenInfoIndex, info.value)
  if (!tokenInfo) return info
  return {
    ...info,
    name: info.name ?? tokenInfo.name,
    logoUri: info.logoUri ?? tokenInfo.logoUri,
    symbol: tokenInfo.symbol,
    decimals: 'decimals' in tokenInfo ? tokenInfo.decimals : undefined,
  }
}

/** The approvals a successful transaction made, including those inside a MultiSend batch */
export const extractApprovals = (details: TransactionDetails, timestamp: number): ApprovalRecord[] => {
  const { txData } = details
  if (details.txStatus !== 'SUCCESS' || !txData?.hexData) {
    return []
  }

  return flattenCalls({ to: txData.to.value, data: txData.hexData, operation: txData.operation }).flatMap((call) => {
    const fn = APPROVAL_FUNCTIONS[getSelector(call.data)]
    if (call.operation !== CALL || !fn) {
      return []
    }
    try {
      const [spender] = ERC20_INTERFACE.decodeFunctionData(fn, call.data)
      return [
        {
          token: lookupTokenInfo(txData, call.to),
          spender: lookupAddressInfo(txData, spender),
          txHash: details.txHash ?? null,
          timestamp,
        },
      ]
    } catch {
      // Same selector but different arguments (e.g. a non-ERC-20 `approve`)
      return []
    }
  })
}

/** Whether the Safe delegatecalls code other than MultiSend, which can approve without an `approve` in the calldata */
export const hasOpaqueDelegateCall = (details: TransactionDetails): boolean => {
  const { txData } = details
  if (details.txStatus !== 'SUCCESS' || !txData) {
    return false
  }
  if (!txData.hexData) {
    return txData.operation === DELEGATE_CALL
  }
  return flattenCalls({ to: txData.to.value, data: txData.hexData, operation: txData.operation }).some(
    (call) => call.operation === DELEGATE_CALL,
  )
}

/** The approvals the Safe gave in a transaction, read from the ERC-20 `Approval` events it emitted */
export const extractApprovalsFromEvents = (
  logs: RawLog[],
  safeAddress: string,
  meta: Pick<ApprovalRecord, 'txHash' | 'timestamp'>,
): ApprovalRecord[] =>
  logs
    // ERC-20 `Approval` has 3 topics; ERC-721's has 4
    .filter(
      (log) =>
        log.topics.length === 3 &&
        log.topics[0].toLowerCase() === APPROVAL_EVENT_TOPIC &&
        sameAddress(dataSlice(log.topics[1], 12), safeAddress),
    )
    .map((log) => ({
      token: { value: getAddress(log.address) },
      spender: { value: getAddress(dataSlice(log.topics[2], 12)) },
      ...meta,
    }))

export const getApprovalKey = (record: Pick<ApprovalRecord, 'token' | 'spender'>): string =>
  `${record.token.value}:${record.spender.value}`.toLowerCase()

const withNamesFrom = (record: ApprovalRecord, other: ApprovalRecord): ApprovalRecord => ({
  ...record,
  token: { ...other.token, ...record.token },
  spender: { ...other.spender, ...record.spender },
})

/** One record per token and spender: the most recent approval, keeping names an event-only record lacks */
export const mergeApprovalRecords = (records: ApprovalRecord[]): ApprovalRecord[] => {
  const latest = new Map<string, ApprovalRecord>()
  for (const record of records) {
    const key = getApprovalKey(record)
    const current = latest.get(key)
    if (!current) {
      latest.set(key, record)
    } else {
      latest.set(
        key,
        record.timestamp > current.timestamp ? withNamesFrom(record, current) : withNamesFrom(current, record),
      )
    }
  }
  return [...latest.values()]
}
