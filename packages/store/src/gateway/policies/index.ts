import { cgwClient as api } from '../cgwClient'
import type {
  GetPoliciesResponse,
  GetActivePoliciesResponse,
  GetPendingPoliciesResponse,
  PolicyQueryArg,
} from './types'

// Hand-declared because the policies schema isn't code-generated yet. Every other
// slice imports `addTagTypes` from its AUTO_GENERATED sibling — once policies are
// in the generated schema, import it from there and delete this declaration.
export const addTagTypes = ['policies'] as const

/**
 * Base path for the space-scoped policy routes. The Safe is addressed as
 * `chainId:safeAddress`, URL-encoded because the colon is a delimiter.
 *
 * These live under `/v1/spaces`, which `isCredentialRoute` matches, so the base
 * query sends the session cookie automatically (CGW answers 403 without it).
 */
const policiesPath = ({ spaceId, chainId, safeAddress }: PolicyQueryArg): string =>
  `/v1/spaces/${spaceId}/safes/${encodeURIComponent(`${chainId}:${safeAddress}`)}/policies`

/** Policy engine endpoints (space-scoped, credentialed). */
export const policiesApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
  endpoints: (build) => ({
    policiesGetPoliciesV1: build.query<GetPoliciesResponse, PolicyQueryArg>({
      query: (arg) => ({ url: policiesPath(arg) }),
      providesTags: ['policies'],
    }),
    policiesGetActivePoliciesV1: build.query<GetActivePoliciesResponse, PolicyQueryArg>({
      query: (arg) => ({ url: `${policiesPath(arg)}/active` }),
      providesTags: ['policies'],
    }),
    policiesGetPendingPoliciesV1: build.query<GetPendingPoliciesResponse, PolicyQueryArg>({
      query: (arg) => ({ url: `${policiesPath(arg)}/pending` }),
      providesTags: ['policies'],
    }),
  }),
  overrideExisting: false,
})

export const {
  usePoliciesGetPoliciesV1Query,
  usePoliciesGetActivePoliciesV1Query,
  usePoliciesGetPendingPoliciesV1Query,
} = policiesApi
