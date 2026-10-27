import { cgwClient as api } from '../cgwClient'
import { PolicyType } from './types'
import type {
  GetActivePoliciesResponse,
  GetPendingPoliciesResponse,
  PolicyQueryArg,
  CreatePolicyRequestArg,
  CreatePolicyRequestResponse,
} from './types'

// Hand-declared because the policies schema isn't code-generated yet. Every other
// slice imports `addTagTypes` from its AUTO_GENERATED sibling — once policies are
// in the generated schema, import it from there and delete this declaration.
export const addTagTypes = ['policies'] as const

/**
 * The types to ask for when a caller doesn't narrow it.
 *
 * `types` is required on the read routes, and CGW 422s on a value outside its enum — so
 * MultiSend, which it does not know, is deliberately excluded. A multisend policy is
 * recognised client-side from the policy contract address instead.
 */
export const DEFAULT_POLICY_TYPES: PolicyType[] = [
  PolicyType.SpendingLimit,
  PolicyType.Recovery,
  PolicyType.Proposer,
  PolicyType.TokenWithdraw,
  PolicyType.Cosigner,
  PolicyType.Allow,
  PolicyType.NativeTransfer,
  PolicyType.Deny,
]

/**
 * The read routes are space-scoped, not Safe-scoped: a Safe is a `safes` filter rather than
 * a path segment, and `types` is mandatory. Both are comma-separated.
 *
 * `/v1/spaces` is matched by `isCredentialRoute`, so the base query sends the session cookie
 * automatically (CGW answers 403 without it).
 */
const readParams = ({ chainId, safeAddress, types }: PolicyQueryArg): Record<string, string> => ({
  types: (types ?? DEFAULT_POLICY_TYPES).join(','),
  safes: `${chainId}:${safeAddress}`,
})

/** The write route is Safe-scoped, with the chain and the Safe as separate path segments. */
const requestsPath = ({ spaceId, chainId, safeAddress }: PolicyQueryArg): string =>
  `/v1/spaces/${spaceId}/chains/${chainId}/safes/${safeAddress}/policies/requests`

/** Policy engine endpoints (space-scoped, credentialed). */
export const policiesApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
  endpoints: (build) => ({
    policiesGetActivePoliciesV1: build.query<GetActivePoliciesResponse, PolicyQueryArg>({
      query: (arg) => ({ url: `/v1/spaces/${arg.spaceId}/policies/active`, params: readParams(arg) }),
      providesTags: ['policies'],
    }),
    policiesGetPendingPoliciesV1: build.query<GetPendingPoliciesResponse, PolicyQueryArg>({
      query: (arg) => ({ url: `/v1/spaces/${arg.spaceId}/policies/pending`, params: readParams(arg) }),
      providesTags: ['policies'],
    }),
    policiesCreateRequestV1: build.mutation<CreatePolicyRequestResponse, CreatePolicyRequestArg>({
      query: ({ root, configurations, ...arg }) => ({
        url: requestsPath(arg),
        method: 'POST',
        body: { root, configurations },
      }),
      invalidatesTags: ['policies'],
    }),
  }),
  overrideExisting: false,
})

export const {
  usePoliciesGetActivePoliciesV1Query,
  usePoliciesGetPendingPoliciesV1Query,
  usePoliciesCreateRequestV1Mutation,
} = policiesApi
