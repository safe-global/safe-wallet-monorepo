import { cgwClient } from '@safe-global/store/gateway/cgwClient'

/** What the details form sends. The billing service creates the Stripe customer from it and a trial with no card. */
export type StartTrialBody = { email: string; name: string; company?: string; acceptsTerms: true }

/**
 * Prototype only: the endpoint engineering would add, `POST /v1/billing/spaces/:spaceId/trial`.
 * It does not exist on the CGW yet; Storybook mocks it.
 */
const startTrialApi = cgwClient.injectEndpoints({
  endpoints: (build) => ({
    billingStartTrialV1: build.mutation<{ status: 'trialing' }, { spaceId: string; body: StartTrialBody }>({
      query: ({ spaceId, body }) => ({ url: `/v1/billing/spaces/${spaceId}/trial`, method: 'POST', body }),
    }),
  }),
})

export const { useBillingStartTrialV1Mutation } = startTrialApi
