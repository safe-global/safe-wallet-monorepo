import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

export const { useSpacePoliciesGetActivePoliciesV1Query } = cgwApi.enhanceEndpoints({
  addTagTypes: ['delegates'],
  endpoints: {
    // Proposers are delegates, so adding or removing one refetches the policies.
    spacePoliciesGetActivePoliciesV1: { providesTags: ['spaces', 'delegates'] },
  },
})
