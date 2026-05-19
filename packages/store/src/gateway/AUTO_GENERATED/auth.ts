import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['auth'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      authGetMeV1: build.query<AuthGetMeV1ApiResponse, AuthGetMeV1ApiArg>({
        query: () => ({ url: `/v1/auth/me` }),
        providesTags: ['auth'],
      }),
      authGetNonceV1: build.query<AuthGetNonceV1ApiResponse, AuthGetNonceV1ApiArg>({
        query: () => ({ url: `/v1/auth/nonce` }),
        providesTags: ['auth'],
      }),
      authVerifyV1: build.mutation<AuthVerifyV1ApiResponse, AuthVerifyV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/auth/verify`, method: 'POST', body: queryArg.siweDto }),
        invalidatesTags: ['auth'],
      }),
      authLogoutV1: build.mutation<AuthLogoutV1ApiResponse, AuthLogoutV1ApiArg>({
        query: () => ({ url: `/v1/auth/logout`, method: 'POST' }),
        invalidatesTags: ['auth'],
      }),
      authLogoutWithRedirectV1: build.mutation<AuthLogoutWithRedirectV1ApiResponse, AuthLogoutWithRedirectV1ApiArg>({
        query: (queryArg) => ({ url: `/v1/auth/logout/redirect`, method: 'POST', body: queryArg.logoutDto }),
        invalidatesTags: ['auth'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type AuthGetMeV1ApiResponse = /** status 200 Authenticated user session */ UserSession
export type AuthGetMeV1ApiArg = void
export type AuthGetNonceV1ApiResponse = /** status 200 Unique nonce generated for authentication */ AuthNonce
export type AuthGetNonceV1ApiArg = void
export type AuthVerifyV1ApiResponse = unknown
export type AuthVerifyV1ApiArg = {
  /** Sign-In with Ethereum message and signature for verification */
  siweDto: SiweDto
}
export type AuthLogoutV1ApiResponse = unknown
export type AuthLogoutV1ApiArg = void
export type AuthLogoutWithRedirectV1ApiResponse = unknown
export type AuthLogoutWithRedirectV1ApiArg = {
  logoutDto: LogoutDto
}
export type UserSession = {
  id: string
  authMethod: 'siwe' | 'oidc'
  /** Wallet signer address. Present only for SIWE-authenticated users. */
  signerAddress?: string
  /** Verified email address. Present only for OIDC-authenticated users when stored. */
  email?: string
}
export type AuthNonce = {
  nonce: string
}
export type SiweDto = {
  message: string
  signature: string
}
export type LogoutDto = {
  /** Post-logout redirect URL (must be same-origin as pre-configured URL) */
  redirect_url?: string
}
export const {
  useAuthGetMeV1Query,
  useLazyAuthGetMeV1Query,
  useAuthGetNonceV1Query,
  useLazyAuthGetNonceV1Query,
  useAuthVerifyV1Mutation,
  useAuthLogoutV1Mutation,
  useAuthLogoutWithRedirectV1Mutation,
} = injectedRtkApi
