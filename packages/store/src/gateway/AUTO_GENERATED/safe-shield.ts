import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['safe-shield'] as const
const injectedRtkApi = api
  .enhanceEndpoints({ addTagTypes })
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
export type RecipientInteractionResultDto = {
  /** Severity level indicating the importance and risk */
  severity: 'OK' | 'INFO' | 'WARN' | 'CRITICAL'
  /** Recipient interaction status code */
  type: 'NEW_RECIPIENT' | 'RECURRING_RECIPIENT'
  /** User-facing title of the finding */
  title: string
  /** Detailed description explaining the finding and its implications */
  description: string
}
export type RecipientInteractionAnalysisDto = {
  /** Analysis results related to recipient interaction history. Shows whether this is a new or recurring recipient. */
  RECIPIENT_INTERACTION: RecipientInteractionResultDto[]
}
export const { useSafeShieldAnalyzeRecipientV1Query, useLazySafeShieldAnalyzeRecipientV1Query } = injectedRtkApi
