import { cgwClient } from '@safe-global/store/gateway/cgwClient'

// Hand-written until the CGW route ships and the generated client covers it.

export const SPACE_POLICY_TYPES = [
  'spending-limit',
  'recovery',
  'proposer',
  'erc20-transfer',
  'cosigner',
  'allow',
  'native-transfer',
  'deny',
] as const

export type SpacePolicyType = (typeof SPACE_POLICY_TYPES)[number]

export type SpacePolicySafeRef = {
  chainId: string
  address: string
}

export type PolicyContractsDto = {
  policyContract: string
  safePolicyGuard: string
}

export type PolicyEnforcementDto =
  | { via: 'module'; moduleAddress: string }
  | { via: 'guard'; guards: { transactionGuard?: PolicyContractsDto; moduleGuard?: PolicyContractsDto } }
  | { via: 'offchain'; source: 'delegates' }

export type SpendingLimitAllowanceDto = {
  /** The zero address is the native currency. */
  tokenAddress: string
  amount: string
  spent: string
  /** 0 never resets. */
  resetPeriodMinutes: number
  resetsAtMinute: number | null
  resetBoundaryIsExact: boolean
  isDelegateActive: boolean
}

export type SpendingLimitSpenderDto = {
  spender: string
  isActive: boolean
  allowances: SpendingLimitAllowanceDto[]
}

export type SpendingLimitPolicyDataDto = {
  module: string
  spenders: SpendingLimitSpenderDto[]
}

export type ProposerGrantDto = {
  delegator: string
  label: string
}

export type ProposerDto = {
  proposer: string
  delegatedBy: ProposerGrantDto[]
}

export type ProposerPolicyDataDto = {
  proposers: ProposerDto[]
}

export type ActivePolicyDto = {
  type: SpacePolicyType
  enforcement: PolicyEnforcementDto
  enabled: boolean
  data: SpendingLimitPolicyDataDto | ProposerPolicyDataDto
  safe: SpacePolicySafeRef
}

export type SpacePoliciesGetActiveV1ApiArg = {
  spaceId: string
  types: readonly SpacePolicyType[]
}

export const { useSpacePoliciesGetActiveV1Query } = cgwClient
  .enhanceEndpoints({ addTagTypes: ['spaces', 'delegates'] })
  .injectEndpoints({
    endpoints: (build) => ({
      spacePoliciesGetActiveV1: build.query<ActivePolicyDto[], SpacePoliciesGetActiveV1ApiArg>({
        query: ({ spaceId, types }) => ({
          url: `/v1/spaces/${spaceId}/policies/active`,
          params: { types: types.join(',') },
        }),
        // Proposers are delegates, so adding or removing one refetches the policies.
        providesTags: ['spaces', 'delegates'],
      }),
    }),
  })
