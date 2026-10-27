import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

export const {
  useSpacePoliciesGetActivePoliciesV1Query,
  useSpacePoliciesGetPendingPoliciesV1Query,
  usePoliciesCreateConfigurationRequestV1Mutation,
} = cgwApi.enhanceEndpoints({
  addTagTypes: ['delegates'],
  endpoints: {
    // Proposers are delegates, so adding or removing one refetches the policies.
    spacePoliciesGetActivePoliciesV1: { providesTags: ['spaces', 'delegates'] },
    // A saved request changes nothing the app shows until its transaction executes.
    policiesCreateConfigurationRequestV1: { invalidatesTags: [] },
  },
})
