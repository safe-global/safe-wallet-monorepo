import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['transactions'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      transactionsGetTransactionByIdV1: build.query<
        TransactionsGetTransactionByIdV1ApiResponse,
        TransactionsGetTransactionByIdV1ApiArg
      >({
        query: (queryArg) => ({ url: `/v1/chains/${queryArg.chainId}/transactions/${queryArg.id}` }),
        providesTags: ['transactions'],
      }),
      transactionsGetDomainMultisigTransactionBySafeTxHashV1: build.query<
        TransactionsGetDomainMultisigTransactionBySafeTxHashV1ApiResponse,
        TransactionsGetDomainMultisigTransactionBySafeTxHashV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/chains/${queryArg.chainId}/multisig-transactions/${queryArg.safeTxHash}/raw`,
        }),
        providesTags: ['transactions'],
      }),
      transactionsGetDomainMultisigTransactionsV1: build.query<
        TransactionsGetDomainMultisigTransactionsV1ApiResponse,
        TransactionsGetDomainMultisigTransactionsV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/chains/${queryArg.chainId}/safes/${queryArg.safeAddress}/multisig-transactions/raw`,
          params: {
            failed: queryArg.failed,
            modified__lt: queryArg.modifiedLt,
            modified__gt: queryArg.modifiedGt,
            modified__lte: queryArg.modifiedLte,
            modified__gte: queryArg.modifiedGte,
            nonce__lt: queryArg.nonceLt,
            nonce__gt: queryArg.nonceGt,
            nonce__lte: queryArg.nonceLte,
            nonce__gte: queryArg.nonceGte,
            nonce: queryArg.nonce,
            safe_tx_hash: queryArg.safeTxHash,
            to: queryArg.to,
            value__lt: queryArg.valueLt,
            value__gt: queryArg.valueGt,
            value: queryArg.value,
            executed: queryArg.executed,
            has_confirmations: queryArg.hasConfirmations,
            trusted: queryArg.trusted,
            execution_date__gte: queryArg.executionDateGte,
            execution_date__lte: queryArg.executionDateLte,
            submission_date__gte: queryArg.submissionDateGte,
            submission_date__lte: queryArg.submissionDateLte,
            transaction_hash: queryArg.transactionHash,
            ordering: queryArg.ordering,
            limit: queryArg.limit,
            offset: queryArg.offset,
          },
        }),
        providesTags: ['transactions'],
      }),
      transactionsGetMultisigTransactionsV1: build.query<
        TransactionsGetMultisigTransactionsV1ApiResponse,
        TransactionsGetMultisigTransactionsV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/chains/${queryArg.chainId}/safes/${queryArg.safeAddress}/multisig-transactions`,
          params: {
            execution_date__gte: queryArg.executionDateGte,
            execution_date__lte: queryArg.executionDateLte,
            to: queryArg.to,
            value: queryArg.value,
            nonce: queryArg.nonce,
            executed: queryArg.executed,
            cursor: queryArg.cursor,
          },
        }),
        providesTags: ['transactions'],
      }),
      transactionsDeleteTransactionV1: build.mutation<
        TransactionsDeleteTransactionV1ApiResponse,
        TransactionsDeleteTransactionV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/chains/${queryArg.chainId}/transactions/${queryArg.safeTxHash}`,
          method: 'DELETE',
          body: queryArg.deleteTransactionDto,
        }),
        invalidatesTags: ['transactions'],
      }),
      transactionsGetModuleTransactionsV1: build.query<
        TransactionsGetModuleTransactionsV1ApiResponse,
        TransactionsGetModuleTransactionsV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/chains/${queryArg.chainId}/safes/${queryArg.safeAddress}/module-transactions`,
          params: {
            to: queryArg.to,
            module: queryArg['module'],
            transaction_hash: queryArg.transactionHash,
            cursor: queryArg.cursor,
          },
        }),
        providesTags: ['transactions'],
      }),
      transactionsAddConfirmationV1: build.mutation<
        TransactionsAddConfirmationV1ApiResponse,
        TransactionsAddConfirmationV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/chains/${queryArg.chainId}/transactions/${queryArg.safeTxHash}/confirmations`,
          method: 'POST',
          body: queryArg.addConfirmationDto,
        }),
        invalidatesTags: ['transactions'],
      }),
      transactionsGetIncomingTransfersV1: build.query<
        TransactionsGetIncomingTransfersV1ApiResponse,
        TransactionsGetIncomingTransfersV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/chains/${queryArg.chainId}/safes/${queryArg.safeAddress}/incoming-transfers`,
          params: {
            trusted: queryArg.trusted,
            execution_date__gte: queryArg.executionDateGte,
            execution_date__lte: queryArg.executionDateLte,
            to: queryArg.to,
            value: queryArg.value,
            token_address: queryArg.tokenAddress,
            cursor: queryArg.cursor,
          },
        }),
        providesTags: ['transactions'],
      }),
      transactionsPreviewTransactionV1: build.mutation<
        TransactionsPreviewTransactionV1ApiResponse,
        TransactionsPreviewTransactionV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/chains/${queryArg.chainId}/transactions/${queryArg.safeAddress}/preview`,
          method: 'POST',
          body: queryArg.previewTransactionDto,
        }),
        invalidatesTags: ['transactions'],
      }),
      transactionsGetTransactionQueueV1: build.query<
        TransactionsGetTransactionQueueV1ApiResponse,
        TransactionsGetTransactionQueueV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/chains/${queryArg.chainId}/safes/${queryArg.safeAddress}/transactions/queued`,
          params: {
            trusted: queryArg.trusted,
            cursor: queryArg.cursor,
          },
        }),
        providesTags: ['transactions'],
      }),
      transactionsGetTransactionsHistoryV1: build.query<
        TransactionsGetTransactionsHistoryV1ApiResponse,
        TransactionsGetTransactionsHistoryV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/chains/${queryArg.chainId}/safes/${queryArg.safeAddress}/transactions/history`,
          params: {
            timezone_offset: queryArg.timezoneOffset,
            trusted: queryArg.trusted,
            imitation: queryArg.imitation,
            timezone: queryArg.timezone,
            cursor: queryArg.cursor,
          },
        }),
        providesTags: ['transactions'],
      }),
      transactionsProposeTransactionV1: build.mutation<
        TransactionsProposeTransactionV1ApiResponse,
        TransactionsProposeTransactionV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/chains/${queryArg.chainId}/transactions/${queryArg.safeAddress}/propose`,
          method: 'POST',
          body: queryArg.proposeTransactionDto,
        }),
        invalidatesTags: ['transactions'],
      }),
      transactionsGetCreationTransactionV1: build.query<
        TransactionsGetCreationTransactionV1ApiResponse,
        TransactionsGetCreationTransactionV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/chains/${queryArg.chainId}/safes/${queryArg.safeAddress}/transactions/creation`,
        }),
        providesTags: ['transactions'],
      }),
      transactionsGetDomainCreationTransactionV1: build.query<
        TransactionsGetDomainCreationTransactionV1ApiResponse,
        TransactionsGetDomainCreationTransactionV1ApiArg
      >({
        query: (queryArg) => ({ url: `/v1/chains/${queryArg.chainId}/safes/${queryArg.safeAddress}/creation/raw` }),
        providesTags: ['transactions'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type TransactionsGetTransactionByIdV1ApiResponse = /** status 200  */ TransactionDetails
export type TransactionsGetTransactionByIdV1ApiArg = {
  chainId: string
  id: string
}
export type TransactionsGetDomainMultisigTransactionBySafeTxHashV1ApiResponse =
  /** status 200  */ TxsMultisigTransaction
export type TransactionsGetDomainMultisigTransactionBySafeTxHashV1ApiArg = {
  chainId: string
  safeTxHash: string
}
export type TransactionsGetDomainMultisigTransactionsV1ApiResponse = /** status 200  */ TxsMultisigTransactionPage
export type TransactionsGetDomainMultisigTransactionsV1ApiArg = {
  chainId: string
  safeAddress: string
  failed?: boolean
  modifiedLt?: string
  modifiedGt?: string
  modifiedLte?: string
  modifiedGte?: string
  nonceLt?: number
  nonceGt?: number
  nonceLte?: number
  nonceGte?: number
  nonce?: number
  safeTxHash?: string
  to?: string
  valueLt?: number
  valueGt?: number
  value?: number
  executed?: boolean
  hasConfirmations?: boolean
  trusted?: boolean
  executionDateGte?: string
  executionDateLte?: string
  submissionDateGte?: string
  submissionDateLte?: string
  transactionHash?: string
  ordering?: string
  limit?: number
  offset?: number
}
export type TransactionsGetMultisigTransactionsV1ApiResponse = /** status 200  */ MultisigTransactionPage
export type TransactionsGetMultisigTransactionsV1ApiArg = {
  chainId: string
  safeAddress: string
  executionDateGte?: string
  executionDateLte?: string
  to?: string
  value?: string
  nonce?: string
  executed?: boolean
  cursor?: string
}
export type TransactionsDeleteTransactionV1ApiResponse = unknown
export type TransactionsDeleteTransactionV1ApiArg = {
  chainId: string
  safeTxHash: string
  deleteTransactionDto: DeleteTransactionDto
}
export type TransactionsGetModuleTransactionsV1ApiResponse = /** status 200  */ ModuleTransactionPage
export type TransactionsGetModuleTransactionsV1ApiArg = {
  chainId: string
  safeAddress: string
  to?: string
  module?: string
  transactionHash?: string
  cursor?: string
}
export type TransactionsAddConfirmationV1ApiResponse = /** status 200  */ Transaction
export type TransactionsAddConfirmationV1ApiArg = {
  chainId: string
  safeTxHash: string
  addConfirmationDto: AddConfirmationDto
}
export type TransactionsGetIncomingTransfersV1ApiResponse = /** status 200  */ IncomingTransferPage
export type TransactionsGetIncomingTransfersV1ApiArg = {
  chainId: string
  safeAddress: string
  trusted?: boolean
  executionDateGte?: string
  executionDateLte?: string
  to?: string
  value?: string
  tokenAddress?: string
  cursor?: string
}
export type TransactionsPreviewTransactionV1ApiResponse = /** status 200  */ TransactionPreview
export type TransactionsPreviewTransactionV1ApiArg = {
  chainId: string
  safeAddress: string
  previewTransactionDto: PreviewTransactionDto
}
export type TransactionsGetTransactionQueueV1ApiResponse = /** status 200  */ QueuedItemPage
export type TransactionsGetTransactionQueueV1ApiArg = {
  chainId: string
  safeAddress: string
  trusted?: boolean
  cursor?: string
}
export type TransactionsGetTransactionsHistoryV1ApiResponse = /** status 200  */ TransactionItemPage
export type TransactionsGetTransactionsHistoryV1ApiArg = {
  chainId: string
  safeAddress: string
  timezoneOffset?: string
  trusted?: boolean
  imitation?: boolean
  timezone?: string
  cursor?: string
}
export type TransactionsProposeTransactionV1ApiResponse = /** status 200  */ Transaction
export type TransactionsProposeTransactionV1ApiArg = {
  chainId: string
  safeAddress: string
  proposeTransactionDto: ProposeTransactionDto
}
export type TransactionsGetCreationTransactionV1ApiResponse = /** status 200  */ CreationTransaction
export type TransactionsGetCreationTransactionV1ApiArg = {
  chainId: string
  safeAddress: string
}
export type TransactionsGetDomainCreationTransactionV1ApiResponse = /** status 200  */ TxsCreationTransaction
export type TransactionsGetDomainCreationTransactionV1ApiArg = {
  chainId: string
  safeAddress: string
}
export type AddressInfo = {
  value: string
  name?: string | null
  logoUri?: string | null
}
export type CreationTransactionInfo = {
  type: 'Creation'
  humanDescription?: string | null
  creator: AddressInfo
  transactionHash: string
  implementation?: AddressInfo | null
  factory?: AddressInfo
  saltNonce?: string | null
}
export type CustomTransactionInfo = {
  type: 'Custom'
  humanDescription?: string | null
  to: AddressInfo
  dataSize: string
  value?: string | null
  isCancellation: boolean
  methodName?: string | null
  actionCount?: number | null
}
export type BaseDataDecoded = {
  method: string
  parameters?: DataDecodedParameter[]
}
export type MultiSend = {
  operation: 0 | 1
  value: string
  dataDecoded?: BaseDataDecoded
  to: string
  data?: object
}
export type DataDecodedParameter = {
  name: string
  type: string
  value: object
  valueDecoded?: BaseDataDecoded | MultiSend[] | null
}
export type DataDecoded = {
  method: string
  parameters?: DataDecodedParameter[] | null
  accuracy?: 'FULL_MATCH' | 'PARTIAL_MATCH' | 'ONLY_FUNCTION_MATCH' | 'NO_MATCH' | 'UNKNOWN'
}
export type AddOwner = {
  type: 'ADD_OWNER'
  owner: AddressInfo
  threshold: number
}
export type ChangeMasterCopy = {
  type: 'CHANGE_MASTER_COPY'
  implementation: AddressInfo
}
export type ChangeThreshold = {
  type: 'CHANGE_THRESHOLD'
  threshold: number
}
export type DeleteGuard = {
  type: 'DELETE_GUARD'
}
export type DisableModule = {
  type: 'DISABLE_MODULE'
  module: AddressInfo
}
export type EnableModule = {
  type: 'ENABLE_MODULE'
  module: AddressInfo
}
export type RemoveOwner = {
  type: 'REMOVE_OWNER'
  owner: AddressInfo
  threshold: number
}
export type SetFallbackHandler = {
  type: 'SET_FALLBACK_HANDLER'
  handler: AddressInfo
}
export type SetGuard = {
  type: 'SET_GUARD'
  guard: AddressInfo
}
export type SwapOwner = {
  type: 'SWAP_OWNER'
  oldOwner: AddressInfo
  newOwner: AddressInfo
}
export type SettingsChangeTransaction = {
  type: 'SettingsChange'
  humanDescription?: string | null
  dataDecoded: DataDecoded
  settingsInfo:
    | AddOwner
    | ChangeMasterCopy
    | ChangeThreshold
    | DeleteGuard
    | DisableModule
    | EnableModule
    | RemoveOwner
    | SetFallbackHandler
    | SetGuard
    | SwapOwner
}
export type Erc20Transfer = {
  type: 'ERC20'
  tokenAddress: string
  value: string
  tokenName?: string | null
  tokenSymbol?: string | null
  logoUri?: string | null
  decimals?: number | null
  trusted?: boolean | null
  imitation: boolean
}
export type Erc721Transfer = {
  type: 'ERC721'
  tokenAddress: string
  tokenId: string
  tokenName?: string | null
  tokenSymbol?: string | null
  logoUri?: string | null
  trusted?: boolean | null
}
export type NativeCoinTransfer = {
  type: 'NATIVE_COIN'
  value?: string | null
}
export type TransferTransactionInfo = {
  type: 'Transfer'
  humanDescription?: string | null
  sender: AddressInfo
  recipient: AddressInfo
  direction: 'INCOMING' | 'OUTGOING' | 'UNKNOWN'
  transferInfo: Erc20Transfer | Erc721Transfer | NativeCoinTransfer
}
export type TokenInfo = {
  /** The token address */
  address: string
  /** The token decimals */
  decimals: number
  /** The logo URI for the token */
  logoUri?: string | null
  /** The token name */
  name: string
  /** The token symbol */
  symbol: string
  /** The token trusted status */
  trusted: boolean
}
export type SwapOrderTransactionInfo = {
  type: 'SwapOrder'
  humanDescription?: string | null
  /** The order UID */
  uid: string
  status: 'presignaturePending' | 'open' | 'fulfilled' | 'cancelled' | 'expired' | 'unknown'
  kind: 'buy' | 'sell' | 'unknown'
  orderClass: 'market' | 'limit' | 'liquidity' | 'unknown'
  /** The timestamp when the order expires */
  validUntil: number
  /** The sell token raw amount (no decimals) */
  sellAmount: string
  /** The buy token raw amount (no decimals) */
  buyAmount: string
  /** The executed sell token raw amount (no decimals) */
  executedSellAmount: string
  /** The executed buy token raw amount (no decimals) */
  executedBuyAmount: string
  /** The sell token of the order */
  sellToken: TokenInfo
  /** The buy token of the order */
  buyToken: TokenInfo
  /** The URL to the explorer page of the order */
  explorerUrl: string
  /** The amount of fees paid for this order. */
  executedFee: string
  /** The token in which the fee was paid, expressed by SURPLUS tokens (BUY tokens for SELL orders and SELL tokens for BUY orders). */
  executedFeeToken: string
  /** The (optional) address to receive the proceeds of the trade */
  receiver?: string | null
  owner: string
  /** The App Data for this order */
  fullAppData?: object | null
}
export type SwapTransferTransactionInfo = {
  type: 'SwapTransfer'
  humanDescription?: string | null
  sender: AddressInfo
  recipient: AddressInfo
  direction: string
  transferInfo: Erc20Transfer | Erc721Transfer | NativeCoinTransfer
  /** The order UID */
  uid: string
  status: 'presignaturePending' | 'open' | 'fulfilled' | 'cancelled' | 'expired' | 'unknown'
  kind: 'buy' | 'sell' | 'unknown'
  orderClass: 'market' | 'limit' | 'liquidity' | 'unknown'
  /** The timestamp when the order expires */
  validUntil: number
  /** The sell token raw amount (no decimals) */
  sellAmount: string
  /** The buy token raw amount (no decimals) */
  buyAmount: string
  /** The executed sell token raw amount (no decimals) */
  executedSellAmount: string
  /** The executed buy token raw amount (no decimals) */
  executedBuyAmount: string
  /** The sell token of the order */
  sellToken: TokenInfo
  /** The buy token of the order */
  buyToken: TokenInfo
  /** The URL to the explorer page of the order */
  explorerUrl: string
  /** The amount of fees paid for this order. */
  executedFee: string
  /** The token in which the fee was paid, expressed by SURPLUS tokens (BUY tokens for SELL orders and SELL tokens for BUY orders). */
  executedFeeToken: TokenInfo
  /** The (optional) address to receive the proceeds of the trade */
  receiver?: string | null
  owner: string
  /** The App Data for this order */
  fullAppData?: object | null
}
export type DurationAuto = {
  durationType: 'AUTO'
}
export type DurationLimit = {
  durationType: 'LIMIT_DURATION'
  duration: string
}
export type StartTimeAtMining = {
  startType: 'AT_MINING_TIME'
}
export type StartTimeAtEpoch = {
  startType: 'AT_EPOCH'
  epoch: number
}
export type TwapOrderTransactionInfo = {
  type: 'TwapOrder'
  humanDescription?: string | null
  /** The TWAP status */
  status: 'presignaturePending' | 'open' | 'fulfilled' | 'cancelled' | 'expired' | 'unknown'
  kind: 'buy' | 'sell' | 'unknown'
  class?: 'market' | 'limit' | 'liquidity' | 'unknown'
  /** The order UID of the active order, or null if none is active */
  activeOrderUid?: string | null
  /** The timestamp when the TWAP expires */
  validUntil: number
  /** The sell token raw amount (no decimals) */
  sellAmount: string
  /** The buy token raw amount (no decimals) */
  buyAmount: string
  /** The executed sell token raw amount (no decimals), or null if there are too many parts */
  executedSellAmount?: string | null
  /** The executed buy token raw amount (no decimals), or null if there are too many parts */
  executedBuyAmount?: string | null
  /** The executed surplus fee raw amount (no decimals), or null if there are too many parts */
  executedFee?: string | null
  /** The token in which the fee was paid, expressed by SURPLUS tokens (BUY tokens for SELL orders and SELL tokens for BUY orders). */
  executedFeeToken: string
  /** The sell token of the TWAP */
  sellToken: TokenInfo
  /** The buy token of the TWAP */
  buyToken: TokenInfo
  /** The address to receive the proceeds of the trade */
  receiver: string
  owner: string
  /** The App Data for this TWAP */
  fullAppData?: object | null
  /** The number of parts in the TWAP */
  numberOfParts: string
  /** The amount of sellToken to sell in each part */
  partSellAmount: string
  /** The amount of buyToken that must be bought in each part */
  minPartLimit: string
  /** The duration of the TWAP interval */
  timeBetweenParts: number
  /** Whether the TWAP is valid for the entire interval or not */
  durationOfPart: DurationAuto | DurationLimit
  /** The start time of the TWAP */
  startTime: StartTimeAtMining | StartTimeAtEpoch
}
export type NativeStakingDepositTransactionInfo = {
  type: 'NativeStakingDeposit'
  humanDescription?: string | null
  status:
    | 'NOT_STAKED'
    | 'ACTIVATING'
    | 'DEPOSIT_IN_PROGRESS'
    | 'ACTIVE'
    | 'EXIT_REQUESTED'
    | 'EXITING'
    | 'EXITED'
    | 'SLASHED'
  estimatedEntryTime: number
  estimatedExitTime: number
  estimatedWithdrawalTime: number
  fee: number
  monthlyNrr: number
  annualNrr: number
  value: string
  numValidators: number
  expectedAnnualReward: string
  expectedMonthlyReward: string
  expectedFiatAnnualReward: number
  expectedFiatMonthlyReward: number
  tokenInfo: TokenInfo
  /** Populated after transaction has been executed */
  validators?: string[] | null
}
export type NativeStakingValidatorsExitTransactionInfo = {
  type: 'NativeStakingValidatorsExit'
  humanDescription?: string | null
  status:
    | 'NOT_STAKED'
    | 'ACTIVATING'
    | 'DEPOSIT_IN_PROGRESS'
    | 'ACTIVE'
    | 'EXIT_REQUESTED'
    | 'EXITING'
    | 'EXITED'
    | 'SLASHED'
  estimatedExitTime: number
  estimatedWithdrawalTime: number
  value: string
  numValidators: number
  tokenInfo: TokenInfo
  validators: string[]
}
export type NativeStakingWithdrawTransactionInfo = {
  type: 'NativeStakingWithdraw'
  humanDescription?: string | null
  value: string
  tokenInfo: TokenInfo
  validators: string[]
}
export type VaultInfo = {
  address: string
  name: string
  description: string
  dashboardUri?: string | null
  logoUri: string
}
export type VaultExtraReward = {
  tokenInfo: TokenInfo
  nrr: number
  claimable: string
  claimableNext: string
}
export type VaultDepositTransactionInfo = {
  type: 'VaultDeposit'
  humanDescription?: string | null
  value: string
  baseNrr: number
  fee: number
  tokenInfo: TokenInfo
  vaultInfo: VaultInfo
  currentReward: string
  additionalRewardsNrr: number
  additionalRewards: VaultExtraReward[]
  expectedMonthlyReward: string
  expectedAnnualReward: string
}
export type VaultRedeemTransactionInfo = {
  type: 'VaultRedeem'
  humanDescription?: string | null
  value: string
  baseNrr: number
  fee: number
  tokenInfo: TokenInfo
  vaultInfo: VaultInfo
  currentReward: string
  additionalRewardsNrr: number
  additionalRewards: VaultExtraReward[]
}
export type NativeToken = {
  address: string
  decimals: number
  logoUri: string
  name: string
  symbol: string
  type: 'NATIVE_TOKEN'
}
export type Erc20Token = {
  address: string
  decimals: number
  logoUri: string
  name: string
  symbol: string
  type: 'ERC20'
}
export type Erc721Token = {
  address: string
  decimals: number
  logoUri: string
  name: string
  symbol: string
  type: 'ERC721'
}
export type TransactionData = {
  hexData?: string | null
  dataDecoded?: DataDecoded | null
  to: AddressInfo
  value?: string | null
  operation: number
  trustedDelegateCallTarget?: boolean | null
  addressInfoIndex?: {
    [key: string]: AddressInfo
  } | null
  tokenInfoIndex?: {
    [key: string]: NativeToken | Erc20Token | Erc721Token
  } | null
}
export type MultisigConfirmationDetails = {
  signer: AddressInfo
  signature?: string | null
  submittedAt: number
}
export type MultisigExecutionDetails = {
  type: 'MULTISIG'
  submittedAt: number
  nonce: number
  safeTxGas: string
  baseGas: string
  gasPrice: string
  gasToken: string
  refundReceiver: AddressInfo
  safeTxHash: string
  executor?: AddressInfo | null
  signers: AddressInfo[]
  confirmationsRequired: number
  confirmations: MultisigConfirmationDetails[]
  rejectors: AddressInfo[]
  gasTokenInfo?: (NativeToken | Erc20Token | Erc721Token) | null
  trusted: boolean
  proposer?: AddressInfo | null
  proposedByDelegate?: AddressInfo | null
}
export type ModuleExecutionDetails = {
  type: 'MODULE'
  address: AddressInfo
}
export type SafeAppInfo = {
  name: string
  url: string
  logoUri?: string | null
}
export type TransactionDetails = {
  txInfo:
    | CreationTransactionInfo
    | CustomTransactionInfo
    | SettingsChangeTransaction
    | TransferTransactionInfo
    | SwapOrderTransactionInfo
    | SwapTransferTransactionInfo
    | TwapOrderTransactionInfo
    | NativeStakingDepositTransactionInfo
    | NativeStakingValidatorsExitTransactionInfo
    | NativeStakingWithdrawTransactionInfo
    | VaultDepositTransactionInfo
    | VaultRedeemTransactionInfo
  safeAddress: string
  txId: string
  executedAt?: number | null
  txStatus: 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'AWAITING_CONFIRMATIONS' | 'AWAITING_EXECUTION'
  txData?: TransactionData | null
  detailedExecutionInfo?: (MultisigExecutionDetails | ModuleExecutionDetails) | null
  txHash?: string | null
  safeAppInfo?: SafeAppInfo | null
  note?: string | null
}
export type TxsMultisigTransaction = {
  safe: string
  to: string
  value: string
  data: object
  dataDecoded: object
  operation: number
  gasToken: object
  safeTxGas: object
  baseGas: object
  gasPrice: object
  proposer: object
  proposedByDelegate: object
  refundReceiver: object
  nonce: number
  executionDate: object
  submissionDate: string
  modified: object
  blockNumber: object
  transactionHash: object
  safeTxHash: string
  executor: object
  isExecuted: boolean
  isSuccessful: object
  ethGasPrice: object
  gasUsed: object
  fee: object
  origin: object
  confirmationsRequired: number
  confirmations: object
  signatures: object
  trusted: boolean
}
export type TxsMultisigTransactionPage = {
  count?: number | null
  next?: string | null
  previous?: string | null
  results: TxsMultisigTransaction[]
}
export type MultisigExecutionInfo = {
  type: 'MULTISIG'
  nonce: number
  confirmationsRequired: number
  confirmationsSubmitted: number
  missingSigners?: AddressInfo[] | null
}
export type ModuleExecutionInfo = {
  type: 'MODULE'
  address: AddressInfo
}
export type Transaction = {
  txInfo:
    | CreationTransactionInfo
    | CustomTransactionInfo
    | SettingsChangeTransaction
    | TransferTransactionInfo
    | SwapOrderTransactionInfo
    | SwapTransferTransactionInfo
    | TwapOrderTransactionInfo
    | NativeStakingDepositTransactionInfo
    | NativeStakingValidatorsExitTransactionInfo
    | NativeStakingWithdrawTransactionInfo
    | VaultDepositTransactionInfo
    | VaultRedeemTransactionInfo
  id: string
  txHash?: string | null
  timestamp: number
  txStatus: 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'AWAITING_CONFIRMATIONS' | 'AWAITING_EXECUTION'
  executionInfo?: (MultisigExecutionInfo | ModuleExecutionInfo) | null
  safeAppInfo?: SafeAppInfo | null
}
export type MultisigTransaction = {
  type: 'TRANSACTION'
  transaction: Transaction
  conflictType: 'None' | 'HasNext' | 'End'
}
export type MultisigTransactionPage = {
  count?: number | null
  next?: string | null
  previous?: string | null
  results: MultisigTransaction[]
}
export type DeleteTransactionDto = {
  signature: string
}
export type ModuleTransaction = {
  type: 'TRANSACTION'
  transaction: Transaction
  conflictType: 'None'
}
export type ModuleTransactionPage = {
  count?: number | null
  next?: string | null
  previous?: string | null
  results: ModuleTransaction[]
}
export type AddConfirmationDto = {
  signature: string
}
export type IncomingTransfer = {
  type: 'TRANSACTION'
  transaction: Transaction
  conflictType: 'None'
}
export type IncomingTransferPage = {
  count?: number | null
  next?: string | null
  previous?: string | null
  results: IncomingTransfer[]
}
export type TransactionPreview = {
  txInfo:
    | CreationTransactionInfo
    | CustomTransactionInfo
    | SettingsChangeTransaction
    | TransferTransactionInfo
    | SwapOrderTransactionInfo
    | SwapTransferTransactionInfo
    | TwapOrderTransactionInfo
    | NativeStakingDepositTransactionInfo
    | NativeStakingValidatorsExitTransactionInfo
    | NativeStakingWithdrawTransactionInfo
    | VaultDepositTransactionInfo
    | VaultRedeemTransactionInfo
  txData: TransactionData
}
export type PreviewTransactionDto = {
  to: string
  data?: string | null
  value: string
  operation: number
}
export type ConflictHeaderQueuedItem = {
  type: 'CONFLICT_HEADER'
  nonce: number
}
export type LabelQueuedItem = {
  type: 'LABEL'
  label: string
}
export type TransactionQueuedItem = {
  type: 'TRANSACTION'
  transaction: Transaction
  conflictType: 'None' | 'HasNext' | 'End'
}
export type QueuedItemPage = {
  count?: number | null
  next?: string | null
  previous?: string | null
  results: (ConflictHeaderQueuedItem | LabelQueuedItem | TransactionQueuedItem)[]
}
export type TransactionItem = {
  type: 'TRANSACTION'
  transaction: Transaction
  conflictType: 'None'
}
export type DateLabel = {
  type: 'DATE_LABEL'
  timestamp: number
}
export type TransactionItemPage = {
  count?: number | null
  next?: string | null
  previous?: string | null
  results: (TransactionItem | DateLabel)[]
}
export type ProposeTransactionDto = {
  to: string
  value: string
  data?: string | null
  nonce: string
  operation: number
  safeTxGas: string
  baseGas: string
  gasPrice: string
  gasToken: string
  refundReceiver?: string | null
  safeTxHash: string
  sender: string
  signature?: string | null
  origin?: string | null
}
export type CreationTransaction = {
  created: string
  creator: string
  transactionHash: string
  factoryAddress: string
  masterCopy?: string | null
  setupData?: string | null
  saltNonce?: string | null
  dataDecoded?: DataDecoded | null
}
export type TxsCreationTransaction = {
  created: string
  creator: string
  transactionHash: string
  factoryAddress: string
  masterCopy: object
  setupData: object
  saltNonce: object
  dataDecoded: object
}
export const {
  useTransactionsGetTransactionByIdV1Query,
  useLazyTransactionsGetTransactionByIdV1Query,
  useTransactionsGetDomainMultisigTransactionBySafeTxHashV1Query,
  useLazyTransactionsGetDomainMultisigTransactionBySafeTxHashV1Query,
  useTransactionsGetDomainMultisigTransactionsV1Query,
  useLazyTransactionsGetDomainMultisigTransactionsV1Query,
  useTransactionsGetMultisigTransactionsV1Query,
  useLazyTransactionsGetMultisigTransactionsV1Query,
  useTransactionsDeleteTransactionV1Mutation,
  useTransactionsGetModuleTransactionsV1Query,
  useLazyTransactionsGetModuleTransactionsV1Query,
  useTransactionsAddConfirmationV1Mutation,
  useTransactionsGetIncomingTransfersV1Query,
  useLazyTransactionsGetIncomingTransfersV1Query,
  useTransactionsPreviewTransactionV1Mutation,
  useTransactionsGetTransactionQueueV1Query,
  useLazyTransactionsGetTransactionQueueV1Query,
  useTransactionsGetTransactionsHistoryV1Query,
  useLazyTransactionsGetTransactionsHistoryV1Query,
  useTransactionsProposeTransactionV1Mutation,
  useTransactionsGetCreationTransactionV1Query,
  useLazyTransactionsGetCreationTransactionV1Query,
  useTransactionsGetDomainCreationTransactionV1Query,
  useLazyTransactionsGetDomainCreationTransactionV1Query,
} = injectedRtkApi
