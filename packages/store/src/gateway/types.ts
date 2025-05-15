import {
  CustomTransactionInfo,
  QueuedItemPage,
  TransactionItemPage,
  SwapOrderTransactionInfo,
  TwapOrderTransactionInfo,
  SwapTransferTransactionInfo,
  ModuleExecutionInfo,
  MultisigExecutionInfo,
  AddressInfo,
} from './AUTO_GENERATED/transactions'
import { SafeOverview } from './AUTO_GENERATED/safes'
import { MessageItem, MessagePage, TypedData } from './AUTO_GENERATED/messages'

export enum RPC_AUTHENTICATION {
  API_KEY_PATH = 'API_KEY_PATH',
  NO_AUTHENTICATION = 'NO_AUTHENTICATION',
  UNKNOWN = 'UNKNOWN',
}

export type ExecutionInfo = ModuleExecutionInfo | MultisigExecutionInfo

export type SafeMessageListItemType = MessageItem['type']
export type SafeMessageStatus = MessageItem['status']
export type SafeMessageListItem = MessagePage['results'][number]
export type TypedMessageTypes = TypedData['types']

export enum TransactionStatus {
  AWAITING_CONFIRMATIONS = 'AWAITING_CONFIRMATIONS',
  AWAITING_EXECUTION = 'AWAITING_EXECUTION',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
  SUCCESS = 'SUCCESS',
}

export enum TransferDirection {
  INCOMING = 'INCOMING',
  OUTGOING = 'OUTGOING',
  UNKNOWN = 'UNKNOWN',
}

export enum TransactionTokenType {
  ERC20 = 'ERC20',
  ERC721 = 'ERC721',
  NATIVE_COIN = 'NATIVE_COIN',
}

export enum SettingsInfoType {
  SET_FALLBACK_HANDLER = 'SET_FALLBACK_HANDLER',
  ADD_OWNER = 'ADD_OWNER',
  REMOVE_OWNER = 'REMOVE_OWNER',
  SWAP_OWNER = 'SWAP_OWNER',
  CHANGE_THRESHOLD = 'CHANGE_THRESHOLD',
  CHANGE_IMPLEMENTATION = 'CHANGE_IMPLEMENTATION',
  ENABLE_MODULE = 'ENABLE_MODULE',
  DISABLE_MODULE = 'DISABLE_MODULE',
  SET_GUARD = 'SET_GUARD',
  DELETE_GUARD = 'DELETE_GUARD',
}

export enum TransactionInfoType {
  TRANSFER = 'Transfer',
  SETTINGS_CHANGE = 'SettingsChange',
  CUSTOM = 'Custom',
  CREATION = 'Creation',
  SWAP_ORDER = 'SwapOrder',
  TWAP_ORDER = 'TwapOrder',
  SWAP_TRANSFER = 'SwapTransfer',
  NATIVE_STAKING_DEPOSIT = 'NativeStakingDeposit',
  NATIVE_STAKING_VALIDATORS_EXIT = 'NativeStakingValidatorsExit',
  NATIVE_STAKING_WITHDRAW = 'NativeStakingWithdraw',
}

export enum ConflictType {
  NONE = 'None',
  HAS_NEXT = 'HasNext',
  END = 'End',
}

export enum TransactionListItemType {
  TRANSACTION = 'TRANSACTION',
  LABEL = 'LABEL',
  CONFLICT_HEADER = 'CONFLICT_HEADER',
  DATE_LABEL = 'DATE_LABEL',
}

export enum DetailedExecutionInfoType {
  MULTISIG = 'MULTISIG',
  MODULE = 'MODULE',
}

export type Cancellation = CustomTransactionInfo & {
  isCancellation: true
}

export type MultiSend = CustomTransactionInfo & {
  value: string
  methodName: 'multiSend'
  actionCount: number
  isCancellation: boolean
  humanDescription?: string
}
export type SafeOverviewResult = { data: SafeOverview[]; error: unknown; isLoading: boolean }

export type OrderTransactionInfo = SwapOrderTransactionInfo | TwapOrderTransactionInfo | SwapTransferTransactionInfo

export enum StartTimeValue {
  AT_MINING_TIME = 'AT_MINING_TIME',
  AT_EPOCH = 'AT_EPOCH',
}

export type PendingTransactionItems = QueuedItemPage['results'][number]
export type HistoryTransactionItems = TransactionItemPage['results'][number]

// TODO: fix CGW DataDecodedParameter type. The decodedValue is typed only as an object or object[] there.
export type ActionValueDecoded = {
  data: string
  dataDecoded: {
    method: string
    parameters: {
      name: string
      type: string
      value: string
    }[]
  }
  operation: number
  to: string
  value: string
}

export type AddressInfoIndex = Record<string, AddressInfo>

export type { BalancesGetSupportedFiatCodesV1ApiResponse as FiatCurrencies } from './AUTO_GENERATED/balances'
