import { cgwClient as api } from '../cgwClient'
export const addTagTypes = ['about'] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      aboutGetAbout: build.query<AboutGetAboutApiResponse, AboutGetAboutApiArg>({
        query: () => ({ url: `/about` }),
        providesTags: ['about'],
      }),
    }),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export type AboutGetAboutApiResponse = /** status 200 Application information retrieved successfully */ About
export type AboutGetAboutApiArg = void
export type About = {
  name: string
  version?: string | null
  buildNumber?: string | null
}
export const { useAboutGetAboutQuery, useLazyAboutGetAboutQuery } = injectedRtkApi
