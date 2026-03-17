import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['auth'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      authGetNonceV1: build.query<AuthGetNonceV1ApiResponse, AuthGetNonceV1ApiArg>({
        query: () => ({ url: `/v1/auth/nonce` }),
        providesTags: ['auth'],
      }),
      authVerifyV1: build.mutation<AuthVerifyV1ApiResponse, AuthVerifyV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/auth/verify`, method: 'POST', body: queryArg.body }),
        invalidatesTags: ['auth'],
      }),
      authLogoutV1: build.mutation<AuthLogoutV1ApiResponse, AuthLogoutV1ApiArg>({
        query: () => ({ url: `/v1/auth/logout`, method: 'POST' }),
        invalidatesTags: ['auth'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type AuthGetNonceV1ApiResponse = /** status 200 Unique nonce generated for authentication */ AuthNonce
export type AuthGetNonceV1ApiArg = void
export type AuthVerifyV1ApiResponse = unknown
export type AuthVerifyV1ApiArg = {
  /** Sign-In with Ethereum message and signature, or Auth0 access token for verification */
  body: SiweDto | Auth0Dto
}
export type AuthLogoutV1ApiResponse = unknown
export type AuthLogoutV1ApiArg = void
export type AuthNonce = {
  nonce: string
}
export type SiweDto = {
  message: string
  signature: string
}
export type Auth0Dto = {
  access_token: string
}
export const { useAuthGetNonceV1Query, useLazyAuthGetNonceV1Query, useAuthVerifyV1Mutation, useAuthLogoutV1Mutation } =
  injectedRtkApi
