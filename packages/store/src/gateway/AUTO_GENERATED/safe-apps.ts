import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['safe-apps'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      safeAppsGetSafeAppsV1: build.query<SafeAppsGetSafeAppsV1ApiResponse, SafeAppsGetSafeAppsV1ApiArg>({
        query: (queryArg) => ({
          url: `/v1/chains/${queryArg.chainId}/safe-apps`,
          params: {
            clientUrl: queryArg.clientUrl,
            url: queryArg.url,
          },
        }),
        providesTags: ['safe-apps'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type SafeAppsGetSafeAppsV1ApiResponse = /** status 200  */ SafeApp[]
export type SafeAppsGetSafeAppsV1ApiArg = {
  chainId: string
  clientUrl?: string
  url?: string
}
export type SafeAppProvider = {
  url: string
  name: string
}
export type SafeAppAccessControl = {
  type: string
  value?: string[] | null
}
export type SafeAppSocialProfile = {
  platform: 'DISCORD' | 'GITHUB' | 'TWITTER' | 'TELEGRAM' | 'UNKNOWN'
  url: string
}
export type SafeApp = {
  id: number
  url: string
  name: string
  iconUrl?: string | null
  description: string
  chainIds: string[]
  provider?: SafeAppProvider | null
  accessControl: SafeAppAccessControl
  tags: string[]
  features: string[]
  developerWebsite?: string | null
  socialProfiles: SafeAppSocialProfile[]
  featured: boolean
}
export const { useSafeAppsGetSafeAppsV1Query, useLazySafeAppsGetSafeAppsV1Query } = injectedRtkApi
