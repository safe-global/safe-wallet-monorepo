import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['export'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      csvExportLaunchExportV1: build.mutation<CsvExportLaunchExportV1ApiResponse, CsvExportLaunchExportV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/export/chains/${queryArg.chainId}/${queryArg.safeAddress}`,
          method: 'POST',
          body: queryArg.transactionExportDto,
        }),
        invalidatesTags: ['export'],
      }),
      csvExportGetExportStatusV1: build.query<CsvExportGetExportStatusV1ApiResponse, CsvExportGetExportStatusV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/export/${queryArg.jobId}/status` }),
        providesTags: ['export'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type CsvExportLaunchExportV1ApiResponse = /** status 202  */ JobStatusDto
export type CsvExportLaunchExportV1ApiArg = {
  chainId: string
  safeAddress: string
  /** Transaction export request */
  transactionExportDto: TransactionExportDto
}
export type CsvExportGetExportStatusV1ApiResponse =
  /** status 200 CSV export status retrieved successfully */ JobStatusDto
export type CsvExportGetExportStatusV1ApiArg = {
  jobId: string
}
export type JobStatusDto = {
  /** Job ID */
  id: string
  /** Job name */
  name: string
  /** Job data payload */
  data: object
  /** Timestamp when the job was created */
  timestamp: number
  /** Job progress */
  progress: number | string | boolean | object
  /** Timestamp when job processing started */
  processedOn: number
  /** Timestamp when job finished */
  finishedOn: number
  /** Reason for job failure */
  failedReason: string
  /** Job return value */
  returnValue: object
}
export type TransactionExportDto = {
  /** Execution date greater than or equal to (ISO date string) */
  executionDateGte?: string
  /** Execution date less than or equal to (ISO date string) */
  executionDateLte?: string
  /** Maximum number of transactions to export */
  limit?: number
  /** Number of transactions to start from */
  offset?: number
}
export type JobStatusErrorDto = {
  /** Error message */
  error: string
}
export const {
  useCsvExportLaunchExportV1Mutation,
  useCsvExportGetExportStatusV1Query,
  useLazyCsvExportGetExportStatusV1Query,
} = injectedRtkApi
