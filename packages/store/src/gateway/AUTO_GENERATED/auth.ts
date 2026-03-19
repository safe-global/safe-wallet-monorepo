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
      authAuthorizeV1: build.query<AuthAuthorizeV1ApiResponse, AuthAuthorizeV1ApiArg>({
        query: () => ({ url: `/v1/auth/oidc/authorize` }),
        providesTags: ['auth'],
      }),
      authCallbackV1: build.query<AuthCallbackV1ApiResponse, AuthCallbackV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/auth/oidc/callback`,
          params: {
            code: queryArg.code,
            state: queryArg.state,
            error: queryArg.error,
            error_description: queryArg.errorDescription,
          },
        }),
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
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type AuthGetNonceV1ApiResponse = /** status 200 Unique nonce generated for authentication */ AuthNonce
export type AuthGetNonceV1ApiArg = void
export type AuthAuthorizeV1ApiResponse = unknown
export type AuthAuthorizeV1ApiArg = void
export type AuthCallbackV1ApiResponse = unknown
export type AuthCallbackV1ApiArg = {
  /** Authorization code returned by the OIDC provider */
  code?: string
  /** State parameter returned by the OIDC provider */
  state?: string
  /** Error parameter returned by the OIDC provider */
  error?: string
  /** Description of the error returned by the OIDC provider (if failed) */
  errorDescription?: string
}
export type AuthVerifyV1ApiResponse = unknown
export type AuthVerifyV1ApiArg = {
  /** Sign-In with Ethereum message and signature for verification */
  siweDto: SiweDto
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
export const {
  useAuthGetNonceV1Query,
  useLazyAuthGetNonceV1Query,
  useAuthAuthorizeV1Query,
  useLazyAuthAuthorizeV1Query,
  useAuthCallbackV1Query,
  useLazyAuthCallbackV1Query,
  useAuthVerifyV1Mutation,
  useAuthLogoutV1Mutation,
} = injectedRtkApi
