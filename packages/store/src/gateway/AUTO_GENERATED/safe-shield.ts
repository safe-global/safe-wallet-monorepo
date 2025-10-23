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
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type SafeShieldAnalyzeRecipientV1ApiResponse =
  /** status 200 Recipient interaction analysis results */ RecipientInteractionAnalysisDto
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
export type RecipientInteractionResultDto = {
  /** Severity level indicating the importance and risk */
  severity: 'OK' | 'INFO' | 'WARN' | 'CRITICAL'
  /** Recipient interaction status code */
  type: 'NEW_RECIPIENT' | 'RECURRING_RECIPIENT' | 'FAILED'
  /** User-facing title of the finding */
  title: string
  /** Detailed description explaining the finding and its implications */
  description: string
}
export type RecipientInteractionAnalysisDto = {
  /** Analysis results related to recipient interaction history. Shows whether this is a new or recurring recipient. */
  RECIPIENT_INTERACTION: RecipientInteractionResultDto[]
}
export type RecipientResultDto = {
  /** Severity level indicating the importance and risk */
  severity: 'OK' | 'INFO' | 'WARN' | 'CRITICAL'
  /** Bridge compatibility status code */
  type:
    | 'NEW_RECIPIENT'
    | 'RECURRING_RECIPIENT'
    | 'INCOMPATIBLE_SAFE'
    | 'MISSING_OWNERSHIP'
    | 'UNSUPPORTED_NETWORK'
    | 'DIFFERENT_SAFE_SETUP'
    | 'FAILED'
  /** User-facing title of the finding */
  title: string
  /** Detailed description explaining the finding and its implications */
  description: string
  /** Target chain ID for bridge operations. Only present for BridgeStatus. */
  targetChainId?: string
}
export type RecipientAnalysisDto = {
  /** Analysis results related to recipient interaction history. Shows whether this is a new or recurring recipient. */
  RECIPIENT_INTERACTION?: RecipientResultDto[]
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
    | 'FAILED'
  /** User-facing title of the finding */
  title: string
  /** Detailed description explaining the finding and its implications */
  description: string
}
export type ContractAnalysisDto = {
  /** Analysis results for contract verification status. Shows whether contracts are verified and source code is available. */
  CONTRACT_VERIFICATION?: ContractAnalysisResultDto[]
  /** Analysis results related to contract interaction history. Shows whether this is a new or previously interacted contract. */
  CONTRACT_INTERACTION?: ContractAnalysisResultDto[]
  /** Analysis results for delegatecall operations. Identifies unexpected or potentially dangerous delegate calls. */
  DELEGATECALL?: ContractAnalysisResultDto[]
}
export type CounterpartyAnalysisDto = {
  /** Recipient analysis results mapped by address. Contains recipient interaction history and bridge analysis. */
  recipient: {
    [key: string]: RecipientAnalysisDto
  }
  /** Contract analysis results mapped by address. Contains contract verification, interaction history, and delegatecall analysis. */
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
export const {
  useSafeShieldAnalyzeRecipientV1Query,
  useLazySafeShieldAnalyzeRecipientV1Query,
  useSafeShieldAnalyzeCounterpartyV1Mutation,
} = injectedRtkApi
