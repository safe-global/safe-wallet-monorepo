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
      oidcAuthAuthorizeV1: build.query<OidcAuthAuthorizeV1ApiResponse, OidcAuthAuthorizeV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/auth/oidc/authorize`,
          params: {
            redirect_url: queryArg.redirectUrl,
            connection: queryArg.connection,
          },
        }),
        providesTags: ['auth'],
      }),
      oidcAuthCallbackV1: build.query<OidcAuthCallbackV1ApiResponse, OidcAuthCallbackV1ApiArg>({
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
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type AuthGetMeV1ApiResponse = unknown
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
export type OidcAuthAuthorizeV1ApiResponse = unknown
export type OidcAuthAuthorizeV1ApiArg = {
  /** URL to redirect to after successful login. Must be same-origin as the configured post-login redirect URI. */
  redirectUrl?: string
  /** OIDC connection name to route to a specific identity provider. */
  connection?: string
}
export type OidcAuthCallbackV1ApiResponse = unknown
export type OidcAuthCallbackV1ApiArg = {
  /** Authorization code returned by the OIDC provider */
  code?: string
  /** State parameter returned by the OIDC provider */
  state?: string
  /** Error parameter returned by the OIDC provider */
  error?: string
  /** Description of the error returned by the OIDC provider (if failed) */
  errorDescription?: string
}
export type AuthNonce = {
  nonce: string
}
export type SiweDto = {
  message: string
  signature: string
}
export const {
  useAuthGetMeV1Query,
  useLazyAuthGetMeV1Query,
  useAuthGetNonceV1Query,
  useLazyAuthGetNonceV1Query,
  useAuthVerifyV1Mutation,
  useAuthLogoutV1Mutation,
  useOidcAuthAuthorizeV1Query,
  useLazyOidcAuthAuthorizeV1Query,
  useOidcAuthCallbackV1Query,
  useLazyOidcAuthCallbackV1Query,
} = injectedRtkApi
