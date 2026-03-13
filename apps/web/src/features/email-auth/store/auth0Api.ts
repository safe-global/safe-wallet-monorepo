// This file is a placeholder for the Auth0 token exchange API.
// TODO: replace with the auto-generated API handler from the @safe-global/store package when it is available.
import { cgwClient } from '@safe-global/store/gateway/cgwClient'

const auth0Api = cgwClient.injectEndpoints({
  endpoints: (build) => ({
    authVerifyV2: build.mutation<void, { id_token: string }>({
      query: (body) => ({
        url: '/v2/auth/verify',
        method: 'POST',
        body,
      }),
    }),
  }),
})

export const { useAuthVerifyV2Mutation } = auth0Api
