/**
 * Mock for next/navigation in Storybook.
 *
 * @storybook/nextjs only creates next/navigation (app-router) mocks when a story
 * sets `nextjs.appDirectory: true`, which mutually excludes the pages-router
 * (next/router) mock the rest of the app relies on. This app is predominantly
 * pages-router but its shell (PageLayout → Topbar, SafenetStakingButton) and a
 * number of hooks (e.g. useChainId via useParams) use next/navigation. Aliasing
 * next/navigation here lets both routers coexist without the
 * "NextjsRouterMocksNotAvailable" error.
 *
 * Crucially, these hooks DERIVE from the @storybook/nextjs pages-router mock
 * (next/router), which createMockStory populates via `nextjs.router.query`
 * (e.g. `{ safe: 'eth:0x…' }`). A static empty stub would make useParams/
 * useSearchParams return nothing, so safe/chain-scoped lookups (batch slice,
 * RTK-query lists, …) miss and the component renders its empty state.
 */
import { useRouter as usePagesRouter } from 'next/router'

const noop = () => {}

const toSearchParams = (query) => {
  const params = new URLSearchParams()
  Object.entries(query || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((v) => params.append(key, String(v)))
    else if (value != null) params.set(key, String(value))
  })
  return params
}

export const useRouter = () => {
  const router = usePagesRouter()
  return {
    push: router?.push ?? noop,
    replace: router?.replace ?? noop,
    back: router?.back ?? noop,
    forward: noop,
    refresh: noop,
    prefetch: router?.prefetch ?? (() => Promise.resolve()),
  }
}

export const usePathname = () => usePagesRouter()?.pathname ?? '/'
export const useSearchParams = () => toSearchParams(usePagesRouter()?.query)
export const useParams = () => usePagesRouter()?.query ?? {}
export const useSelectedLayoutSegment = () => null
export const useSelectedLayoutSegments = () => []
export const redirect = noop
export const permanentRedirect = noop
export const notFound = noop
export const ReadonlyURLSearchParams = URLSearchParams
