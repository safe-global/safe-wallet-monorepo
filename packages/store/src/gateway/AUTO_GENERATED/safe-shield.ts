import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['safe-shield'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      safeShieldAnalyzeRecipientV1: build.query<
        SafeShieldAnalyzeRecipientV1ApiResponse,
        SafeShieldAnalyzeRecipientV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/chains/${queryArg.chainId}/security/${queryArg.safeAddress}/recipient/${queryArg.recipientAddress}`,
        }),
        providesTags: ['safe-shield'],
      }),
      safeShieldAnalyzeCounterpartyV1: build.mutation<
        SafeShieldAnalyzeCounterpartyV1ApiResponse,
        SafeShieldAnalyzeCounterpartyV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/chains/${queryArg.chainId}/security/${queryArg.safeAddress}/counterparty-analysis`,
          method: 'POST',
          body: queryArg.counterpartyAnalysisRequestDto,
        }),
        invalidatesTags: ['safe-shield'],
      }),
      safeShieldAnalyzeThreatV1: build.mutation<SafeShieldAnalyzeThreatV1ApiResponse, SafeShieldAnalyzeThreatV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/chains/${queryArg.chainId}/security/${queryArg.safeAddress}/threat-analysis`,
          method: 'POST',
          body: queryArg.threatAnalysisRequestDto,
        }),
        invalidatesTags: ['safe-shield'],
      }),
      safeShieldReportFalseResultV1: build.mutation<
        SafeShieldReportFalseResultV1ApiResponse,
        SafeShieldReportFalseResultV1ApiArg
      >({
        query: (queryArg) => ({
          url: `/v1/chains/${queryArg.chainId}/security/${queryArg.safeAddress}/report-false-result`,
          method: 'POST',
          body: queryArg.reportFalseResultRequestDto,
        }),
        invalidatesTags: ['safe-shield'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type SafeShieldAnalyzeRecipientV1ApiResponse =
  /** status 200 Recipient interaction analysis results */ SingleRecipientAnalysisDto
export type SafeShieldAnalyzeRecipientV1ApiArg = {
  /** Chain ID where the Safe is deployed */
  chainId: string
  /** Safe contract address */
  safeAddress: string
  /** Recipient address to analyze */
  recipientAddress: string
}
export type SafeShieldAnalyzeCounterpartyV1ApiResponse =
  /** status 200 Combined counterparty analysis including recipients and contracts grouped by status group and mapped to an address. */ CounterpartyAnalysisDto
export type SafeShieldAnalyzeCounterpartyV1ApiArg = {
  /** Chain ID where the Safe is deployed */
  chainId: string
  /** Safe contract address */
  safeAddress: string
  /** Transaction data used to analyze all counterparties involved. */
  counterpartyAnalysisRequestDto: CounterpartyAnalysisRequestDto
}
export type SafeShieldAnalyzeThreatV1ApiResponse =
  /** status 200 Threat analysis results including threat findings and balance changes. */ ThreatAnalysisResponseDto
export type SafeShieldAnalyzeThreatV1ApiArg = {
  /** Chain ID where the Safe is deployed */
  chainId: string
  /** Safe contract address */
  safeAddress: string
  /** EIP-712 typed data and wallet information for threat analysis. */
  threatAnalysisRequestDto: ThreatAnalysisRequestDto
}
export type SafeShieldReportFalseResultV1ApiResponse =
  /** status 200 Report submitted successfully. */ ReportFalseResultResponseDto
export type SafeShieldReportFalseResultV1ApiArg = {
  /** Chain ID where the Safe is deployed */
  chainId: string
  /** Safe contract address */
  safeAddress: string
  /** Report details including event type, request_id from scan response, and details. */
  reportFalseResultRequestDto: ReportFalseResultRequestDto
}
export type SingleRecipientAnalysisResultDto = {
  /** Severity level indicating the importance and risk */
  severity: 'OK' | 'INFO' | 'WARN' | 'CRITICAL'
  /** Recipient interaction status code */
  type: 'NEW_RECIPIENT' | 'RECURRING_RECIPIENT' | 'LOW_ACTIVITY' | 'FAILED'
  /** User-facing title of the finding */
  title: string
  /** Detailed description explaining the finding and its implications */
  description: string
  /** Error message for failed analysis */
  error?: string
}
export type SingleRecipientAnalysisDto = {
  /** Analysis results related to recipient interaction history. Shows whether this is a new or recurring recipient. */
  RECIPIENT_INTERACTION: SingleRecipientAnalysisResultDto[]
  /** Analysis results related to recipient activity. Shows whether this is a low activity recipient. (Available only for Safes) */
  RECIPIENT_ACTIVITY?: SingleRecipientAnalysisResultDto[]
  /** Indicates whether the analyzed recipient address is a Safe. */
  isSafe: boolean
}
export type RecipientResultDto = {
  /** Severity level indicating the importance and risk */
  severity: 'OK' | 'INFO' | 'WARN' | 'CRITICAL'
  /** Bridge compatibility status code */
  type:
    | 'NEW_RECIPIENT'
    | 'RECURRING_RECIPIENT'
    | 'LOW_ACTIVITY'
    | 'INCOMPATIBLE_SAFE'
    | 'MISSING_OWNERSHIP'
    | 'UNSUPPORTED_NETWORK'
    | 'DIFFERENT_SAFE_SETUP'
    | 'FAILED'
  /** User-facing title of the finding */
  title: string
  /** Detailed description explaining the finding and its implications */
  description: string
  /** Error message for failed analysis */
  error?: string
  /** Target chain ID for bridge operations. Only present for BridgeStatus. */
  targetChainId?: string
}
export type RecipientAnalysisDto = {
  /** Indicates whether the analyzed recipient address is a Safe. */
  isSafe: boolean
  /** Analysis results related to recipient interaction history. Shows whether this is a new or recurring recipient. */
  RECIPIENT_INTERACTION?: RecipientResultDto[]
  /** Analysis results related to recipient activity frequency. Shows whether this is a low activity recipient. */
  RECIPIENT_ACTIVITY?: RecipientResultDto[]
  /** Analysis results for cross-chain bridge operations. Identifies compatibility issues, ownership problems, or unsupported networks. */
  BRIDGE?: RecipientResultDto[]
}
export type ContractAnalysisResultDto = {
  /** Severity level indicating the importance and risk */
  severity: 'OK' | 'INFO' | 'WARN' | 'CRITICAL'
  /** Contract verification status code */
  type:
    | 'VERIFIED'
    | 'NOT_VERIFIED'
    | 'NOT_VERIFIED_BY_SAFE'
    | 'VERIFICATION_UNAVAILABLE'
    | 'NEW_CONTRACT'
    | 'KNOWN_CONTRACT'
    | 'UNEXPECTED_DELEGATECALL'
    | 'UNOFFICIAL_FALLBACK_HANDLER'
    | 'FAILED'
  /** User-facing title of the finding */
  title: string
  /** Detailed description explaining the finding and its implications */
  description: string
  /** Error message for failed analysis */
  error?: string
}
export type FallbackHandlerInfoDto = {
  /** Address of the fallback handler contract */
  address: string
  /** Name of the fallback handler contract */
  name?: string
  /** Logo URL for the fallback handler contract */
  logoUrl?: string
}
export type FallbackHandlerAnalysisResultDto = {
  /** Severity level indicating the importance and risk */
  severity: 'OK' | 'INFO' | 'WARN' | 'CRITICAL'
  /** Status code for unofficial fallback handler */
  type: 'UNOFFICIAL_FALLBACK_HANDLER'
  /** User-facing title of the finding */
  title: string
  /** Detailed description explaining the finding and its implications */
  description: string
  /** Error message for failed analysis */
  error?: string
  /** Information about the fallback handler */
  fallbackHandler?: FallbackHandlerInfoDto
}
export type ContractAnalysisDto = {
  /** Logo URL for the contract */
  logoUrl?: string
  /** Name of the contract */
  name?: string
  /** Analysis results for contract verification status. Shows whether contracts are verified and source code is available. */
  CONTRACT_VERIFICATION?: ContractAnalysisResultDto[]
  /** Analysis results related to contract interaction history. Shows whether this is a new or previously interacted contract. */
  CONTRACT_INTERACTION?: ContractAnalysisResultDto[]
  /** Analysis results for delegatecall operations. Identifies unexpected or potentially dangerous delegate calls. */
  DELEGATECALL?: ContractAnalysisResultDto[]
  /** Analysis results for setFallbackHandler operations. Identifies untrusted or unofficial fallback handlers in the transactions. */
  FALLBACK_HANDLER?: FallbackHandlerAnalysisResultDto[]
}
export type CounterpartyAnalysisDto = {
  /** Recipient analysis results mapped by address. Contains recipient interaction history and bridge analysis.type: Record<Address, RecipientAnalysisDto>. */
  recipient: {
    [key: string]: RecipientAnalysisDto
  }
  /** Contract analysis results mapped by address. Contains contract verification, interaction history, and delegatecall analysis.type: Record<Address, ContractAnalysisDto>. */
  contract: {
    [key: string]: ContractAnalysisDto
  }
}
export type CounterpartyAnalysisRequestDto = {
  /** Recipient address of the transaction. */
  to: string
  /** Amount to send with the transaction. */
  value: string
  /** Hex-encoded data payload for the transaction. */
  data: string
  /** Operation type: 0 for CALL, 1 for DELEGATECALL. */
  operation: 0 | 1
}
export type ThreatAnalysisResultDto = {
  /** Severity level indicating the importance and risk */
  severity: 'OK' | 'INFO' | 'WARN' | 'CRITICAL'
  /** Threat status code */
  type: 'NO_THREAT' | 'OWNERSHIP_CHANGE' | 'MODULE_CHANGE'
  /** User-facing title of the finding */
  title: string
  /** Detailed description explaining the finding and its implications */
  description: string
  /** Error message for failed analysis */
  error?: string
}
export type MasterCopyChangeThreatAnalysisResultDto = {
  /** Severity level indicating the importance and risk */
  severity: 'OK' | 'INFO' | 'WARN' | 'CRITICAL'
  /** Threat status code */
  type: 'MASTERCOPY_CHANGE'
  /** User-facing title of the finding */
  title: string
  /** Detailed description explaining the finding and its implications */
  description: string
  /** Error message for failed analysis */
  error?: string
  /** Address of the old master copy/implementation contract */
  before: string
  /** Address of the new master copy/implementation contract */
  after: string
}
export type ThreatIssueDto = {
  /** Address involved in the issue, if applicable */
  address?: string
  /** Issue description */
  description: string
}
export type MaliciousOrModerateThreatAnalysisResultDto = {
  /** Severity level indicating the importance and risk */
  severity: 'OK' | 'INFO' | 'WARN' | 'CRITICAL'
  /** Threat status code */
  type: 'MALICIOUS' | 'MODERATE'
  /** User-facing title of the finding */
  title: string
  /** Detailed description explaining the finding and its implications */
  description: string
  /** Error message for failed analysis */
  error?: string
  /** A partial record of specific issues identified during threat analysis, grouped by severity.Record<Severity, ThreatIssue[]> - keys should be one of the Severity enum (OK | INFO | WARN | CRITICAL) */
  issues?: {
    [key: string]: ThreatIssueDto[]
  }
}
export type FailedThreatAnalysisResultDto = {
  /** Severity level indicating the importance and risk */
  severity: 'OK' | 'INFO' | 'WARN' | 'CRITICAL'
  /** Threat status code */
  type: 'FAILED'
  /** User-facing title of the finding */
  title: string
  /** Detailed description explaining the finding and its implications */
  description: string
  /** Error message for failed analysis */
  error?: string
}
export type NativeAssetDetailsDto = {
  /** Token symbol (if available) */
  symbol?: string
  /** URL to asset logo (if available) */
  logo_url?: string
  /** Asset type */
  type: 'NATIVE'
}
export type TokenAssetDetailsDto = {
  /** Token symbol (if available) */
  symbol?: string
  /** URL to asset logo (if available) */
  logo_url?: string
  /** Asset type */
  type: 'ERC20' | 'ERC721' | 'ERC1155'
  /** Token contract address */
  address: string
}
export type FungibleDiffDto = {
  /** Value change for fungible tokens */
  value?: string
}
export type NftDiffDto = {
  /** Token ID for NFTs */
  token_id: number
}
export type BalanceChangeDto = {
  /** Asset details */
  asset: NativeAssetDetailsDto | TokenAssetDetailsDto
  /** Incoming asset changes */
  in: (FungibleDiffDto | NftDiffDto)[]
  /** Outgoing asset changes */
  out: (FungibleDiffDto | NftDiffDto)[]
}
export type ThreatAnalysisResponseDto = {
  /** Array of threat analysis results. Results are sorted by severity (CRITICAL first). May include malicious patterns, ownership changes, module changes, or master copy upgrades. */
  THREAT?: (
    | ThreatAnalysisResultDto
    | MasterCopyChangeThreatAnalysisResultDto
    | MaliciousOrModerateThreatAnalysisResultDto
    | FailedThreatAnalysisResultDto
  )[]
  /** Balance changes resulting from the transaction. Shows incoming and outgoing transfers for various asset types. */
  BALANCE_CHANGE?: BalanceChangeDto[]
  /** Blockaid request ID from x-request-id header. Used for reporting false positives/negatives via the report endpoint. */
  request_id?: string
}
export type TypedDataDomain = {
  chainId?: number
  name?: string
  salt?: string
  verifyingContract?: string
  version?: string
}
export type TypedDataParameter = {
  name: string
  type: string
}
export type TypedData = {
  domain: TypedDataDomain
  primaryType: string
  types: {
    [key: string]: TypedDataParameter[]
  }
  message: {
    [key: string]: any
  }
}
export type ThreatAnalysisRequestDto = {
  /** EIP-712 typed data to analyze for security threats. Contains domain, primaryType, types, and message fields following the EIP-712 standard for structured data signing. */
  data: TypedData
  /** Address of the transaction signer/wallet */
  walletAddress: string
  /** Optional origin identifier for the request */
  origin?: string
}
export type ReportFalseResultResponseDto = {
  /** Whether the report was submitted successfully */
  success: boolean
}
export type ReportFalseResultRequestDto = {
  /** Type of report: FALSE_POSITIVE if flagged incorrectly, FALSE_NEGATIVE if should have been flagged */
  event: 'FALSE_POSITIVE' | 'FALSE_NEGATIVE'
  /** The request_id from the original Blockaid scan response */
  request_id: string
  /** Details about why this is a false result */
  details: string
}
export const {
  useSafeShieldAnalyzeRecipientV1Query,
  useLazySafeShieldAnalyzeRecipientV1Query,
  useSafeShieldAnalyzeCounterpartyV1Mutation,
  useSafeShieldAnalyzeThreatV1Mutation,
  useSafeShieldReportFalseResultV1Mutation,
} = injectedRtkApi
