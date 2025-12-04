import { cgwClient as api } from '../cgwClient'
export const addTagTypes = [] as const
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({}),
    overrideExisting: false,
  })
export { injectedRtkApi as cgwApi }
export const {} = injectedRtkApi
