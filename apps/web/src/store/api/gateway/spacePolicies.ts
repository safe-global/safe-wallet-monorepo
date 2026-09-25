import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { ModuleEnforcementDto, SafeRefDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

// Hand-written until CGW #3495 lands in the published schema, then these are replaced by codegen.
export type EnableModuleChangeDto = {
  kind: 'enable-module'
  operation: 'create'
}

export type AddDelegateChangeDto = {
  kind: 'add-delegate'
  operation: 'create'
  delegate: string
}

export type RemoveDelegateChangeDto = {
  kind: 'remove-delegate'
  operation: 'remove'
  delegate: string
  removeAllowances: boolean
}

export type SetAllowanceChangeDto = {
  kind: 'set-allowance'
  operation: 'update'
  delegate: string
  token: string
  amount: string
  resetPeriodMinutes: number
}

export type ResetAllowanceChangeDto = {
  kind: 'reset-allowance'
  operation: 'update'
  delegate: string
  token: string
}

export type DeleteAllowanceChangeDto = {
  kind: 'delete-allowance'
  operation: 'remove'
  delegate: string
  token: string
}

export type PendingSpendingLimitDataDto = {
  module: string
  changes: Array<
    | EnableModuleChangeDto
    | AddDelegateChangeDto
    | RemoveDelegateChangeDto
    | SetAllowanceChangeDto
    | ResetAllowanceChangeDto
    | DeleteAllowanceChangeDto
  >
}

export type PendingPolicyDto = {
  kind: 'queued-transaction'
  type: 'spending-limit'
  enforcement: ModuleEnforcementDto
  safeTxHash: string
  nonce: number
  confirmations: number
  confirmationsRequired: number
  proposedAt: number
  data: PendingSpendingLimitDataDto
  safe: SafeRefDto
}

export type SpacePoliciesGetPendingPoliciesV1ApiResponse = PendingPolicyDto[]
export type SpacePoliciesGetPendingPoliciesV1ApiArg = {
  spaceId: string
  types: string[]
  safes?: string
}

const enhancedApi = cgwApi.injectEndpoints({
  endpoints: (build) => ({
    spacePoliciesGetPendingPoliciesV1: build.query<
      SpacePoliciesGetPendingPoliciesV1ApiResponse,
      SpacePoliciesGetPendingPoliciesV1ApiArg
    >({
      query: (queryArg) => ({
        url: `/v1/spaces/${queryArg.spaceId}/policies/pending`,
        params: {
          types: queryArg.types,
          safes: queryArg.safes,
        },
      }),
    }),
  }),
})

export const { useSpacePoliciesGetActivePoliciesV1Query, useSpacePoliciesGetPendingPoliciesV1Query } =
  enhancedApi.enhanceEndpoints({
    addTagTypes: ['delegates'],
    endpoints: {
      // Proposers are delegates, so adding or removing one refetches the policies.
      spacePoliciesGetActivePoliciesV1: { providesTags: ['spaces', 'delegates'] },
      spacePoliciesGetPendingPoliciesV1: { providesTags: ['spaces'] },
    },
  })
