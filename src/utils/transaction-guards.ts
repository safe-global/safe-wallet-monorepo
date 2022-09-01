import {
  AddressEx,
  Cancellation,
  ConflictHeader,
  Creation,
  Custom,
  DateLabel,
  DetailedExecutionInfo,
  Erc20Transfer,
  Erc721Transfer,
  Label,
  ModuleExecutionInfo,
  MultiSend,
  MultisigExecutionDetails,
  MultisigExecutionInfo,
  SettingsChange,
  Transaction,
  TransactionInfo,
  TransactionListItem,
  TransactionStatus,
  TransactionSummary,
  TransactionTokenType,
  Transfer,
} from '@gnosis.pm/safe-react-gateway-sdk'
import { getSpendingLimitModuleAddress } from '@/services/contracts/spendingLimitContracts'
import { sameAddress } from '@/utils/addresses'
import { getMultiSendCallOnlyContractAddress, getMultiSendContractAddress } from '@/services/contracts/safeContracts'
import { NativeCoinTransfer, TransferInfo } from '@gnosis.pm/safe-react-gateway-sdk/dist/types/transactions'
import { NamedAddress } from '@/components/create-safe/types'

export const isTxQueued = (value: TransactionStatus): boolean => {
  return [TransactionStatus.AWAITING_CONFIRMATIONS, TransactionStatus.AWAITING_EXECUTION].includes(value)
}

export const isAwaitingExecution = (txStatus: TransactionStatus): boolean =>
  TransactionStatus.AWAITING_EXECUTION === txStatus

const isAddressEx = (owners: AddressEx[] | NamedAddress[]): owners is AddressEx[] => {
  return (owners as AddressEx[]).every((owner) => owner.value !== undefined)
}

export const isOwner = (safeOwners: AddressEx[] | NamedAddress[] = [], walletAddress?: string) => {
  if (isAddressEx(safeOwners)) {
    return safeOwners.some((owner) => sameAddress(owner.value, walletAddress))
  }

  return safeOwners.some((owner) => sameAddress(owner.address, walletAddress))
}

export const isMultisigExecutionDetails = (value?: DetailedExecutionInfo): value is MultisigExecutionDetails => {
  return value?.type === 'MULTISIG'
}

// TODO: replace this type guard for the one guard above
export const isMultisigExecutionInfo = (value: TransactionSummary['executionInfo']): value is MultisigExecutionInfo =>
  value?.type === EXECUTION_INFO_TYPES.MULTISIG

export const isModuleExecutionInfo = (
  value: TransactionSummary['executionInfo'] | DetailedExecutionInfo,
): value is ModuleExecutionInfo => value?.type === EXECUTION_INFO_TYPES.MODULE

enum EXECUTION_INFO_TYPES {
  MULTISIG = 'MULTISIG',
  MODULE = 'MODULE',
}

// TransactionInfo type guards
// TODO: could be passed to Client GW SDK
export enum TransactionInfoType {
  TRANSFER = 'Transfer',
  SETTINGS_CHANGE = 'SettingsChange',
  CUSTOM = 'Custom',
  CREATION = 'Creation',
}

export const isTransferTxInfo = (value: TransactionInfo): value is Transfer => {
  return value.type === TransactionInfoType.TRANSFER
}

export const isSettingsChangeTxInfo = (value: TransactionInfo): value is SettingsChange => {
  return value.type === TransactionInfoType.SETTINGS_CHANGE
}

export const isCustomTxInfo = (value: TransactionInfo): value is Custom => {
  return value.type === TransactionInfoType.CUSTOM
}

export const isSupportedMultiSendAddress = (txInfo: TransactionInfo, chainId: string): boolean => {
  const toAddress = isCustomTxInfo(txInfo) ? txInfo.to.value : ''
  const multiSendAddress = getMultiSendContractAddress(chainId)
  const multiSendCallOnlyAddress = getMultiSendCallOnlyContractAddress(chainId)

  return sameAddress(multiSendAddress, toAddress) || sameAddress(multiSendCallOnlyAddress, toAddress)
}

export const isMultiSendTxInfo = (value: TransactionInfo): value is MultiSend => {
  return value.type === TransactionInfoType.CUSTOM && value.methodName === 'multiSend'
}

export const isCancellationTxInfo = (value: TransactionInfo): value is Cancellation => {
  return isCustomTxInfo(value) && value.isCancellation
}

export const isCreationTxInfo = (value: TransactionInfo): value is Creation => {
  return value.type === TransactionInfoType.CREATION
}

// TxListItem type guards
// TODO: could be passed to Client GW SDK
export enum TransactionListItemType {
  TRANSACTION = 'TRANSACTION',
  LABEL = 'LABEL',
  CONFLICT_HEADER = 'CONFLICT_HEADER',
  DATE_LABEL = 'DATE_LABEL',
}
export const isTransactionListItem = (value: TransactionListItem): value is Transaction => {
  return value.type === TransactionListItemType.TRANSACTION
}

export const isLabelListItem = (value: TransactionListItem): value is Label => {
  return value.type === TransactionListItemType.LABEL
}

export const isConflictHeaderListItem = (value: TransactionListItem): value is ConflictHeader => {
  return value.type === TransactionListItemType.CONFLICT_HEADER
}

export const isDateLabel = (value: TransactionListItem): value is DateLabel => {
  return value.type === TransactionListItemType.DATE_LABEL
}

export const isSignableBy = (txSummary: TransactionSummary, walletAddress: string): boolean => {
  const executionInfo = isMultisigExecutionInfo(txSummary.executionInfo) ? txSummary.executionInfo : undefined
  return !!executionInfo?.missingSigners?.some((address) => address.value === walletAddress)
}

export const isExecutable = (txSummary: TransactionSummary, walletAddress: string): boolean => {
  if (!txSummary.executionInfo || !isMultisigExecutionInfo(txSummary.executionInfo)) {
    return false
  }
  const { confirmationsRequired, confirmationsSubmitted } = txSummary.executionInfo
  return (
    confirmationsSubmitted >= confirmationsRequired ||
    (confirmationsSubmitted === confirmationsRequired - 1 && isSignableBy(txSummary, walletAddress))
  )
}

// Spending limits
enum SPENDING_LIMIT_METHODS_NAMES {
  ADD_DELEGATE = 'addDelegate',
  SET_ALLOWANCE = 'setAllowance',
  EXECUTE_ALLOWANCE_TRANSFER = 'executeAllowanceTransfer',
  DELETE_ALLOWANCE = 'deleteAllowance',
}

export type SpendingLimitMethods = 'setAllowance' | 'deleteAllowance'

export const isSetAllowance = (method?: string): method is SpendingLimitMethods => {
  return method === SPENDING_LIMIT_METHODS_NAMES.SET_ALLOWANCE
}

export const isDeleteAllowance = (method?: string): method is SpendingLimitMethods => {
  return method === SPENDING_LIMIT_METHODS_NAMES.DELETE_ALLOWANCE
}

export const isSpendingLimitMethod = (method?: string): boolean => {
  return isSetAllowance(method) || isDeleteAllowance(method)
}

export const isSupportedSpendingLimitAddress = (txInfo: TransactionInfo, chainId: string): boolean => {
  const toAddress = isCustomTxInfo(txInfo) ? txInfo.to.value : ''
  const spendingLimitModuleAddress = getSpendingLimitModuleAddress(chainId)

  return sameAddress(spendingLimitModuleAddress, toAddress)
}

// Method parameter types
export const isArrayParameter = (parameter: string): boolean => /(\[\d*])+$/.test(parameter)
export const isAddress = (type: string): boolean => type.indexOf('address') === 0
export const isByte = (type: string): boolean => type.indexOf('byte') === 0

// Conflict types (https://safe.global/safe-client-gateway/docs/routes/transactions/models/summary/enum.ConflictType.html)
// TODO: could be passed to Client GW SDK
enum CONFLICT_TYPES {
  NONE = 'None',
  HAS_NEXT = 'HasNext',
  END = 'End',
}

export const isNoneConflictType = (transaction: Transaction) => {
  return transaction.conflictType === CONFLICT_TYPES.NONE
}
export const isHasNextConflictType = (transaction: Transaction) => {
  return transaction.conflictType === CONFLICT_TYPES.HAS_NEXT
}
export const isEndConflictType = (transaction: Transaction) => {
  return transaction.conflictType === CONFLICT_TYPES.END
}

export const isNativeTokenTransfer = (value: TransferInfo): value is NativeCoinTransfer => {
  return value.type === TransactionTokenType.NATIVE_COIN
}

export const isERC20Transfer = (value: TransferInfo): value is Erc20Transfer => {
  return value.type === TransactionTokenType.ERC20
}

export const isERC721Transfer = (value: TransferInfo): value is Erc721Transfer => {
  return value.type === TransactionTokenType.ERC721
}
