/**
 * Mock for next/navigation in Storybook.
 *
 * @storybook/nextjs only creates next/navigation (app-router) mocks when a
 * story sets `nextjs.appDirectory: true`, which mutually excludes the
 * pages-router (next/router) mock the rest of the app relies on. Since this app
 * is predominantly pages-router but its shell (PageLayout → Topbar,
 * SafenetStakingButton) uses next/navigation hooks, no single `appDirectory`
 * value works. Aliasing next/navigation to these static stubs lets both routers
 * coexist in a single story without the "NextjsRouterMocksNotAvailable" error.
 */
const noop = () => {}

const router = {
  push: noop,
  replace: noop,
  back: noop,
  forward: noop,
  refresh: noop,
  prefetch: noop,
}

const searchParams = new URLSearchParams()

export const useRouter = () => router
export const usePathname = () => '/'
export const useSearchParams = () => searchParams
export const useParams = () => ({})
export const useSelectedLayoutSegment = () => null
export const useSelectedLayoutSegments = () => []
export const redirect = noop
export const permanentRedirect = noop
export const notFound = noop
export const ReadonlyURLSearchParams = URLSearchParams
