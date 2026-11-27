import { useMemo, useState, type MouseEvent, type ReactElement, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import type { NextRouter } from 'next/router'
import { useRouter } from 'next/router'
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime'
import { http, HttpResponse } from 'msw'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { createMockStory } from '@/stories/mocks'
import { createChainData, createChainsPageDataV2 } from '@/stories/mocks/chains'
import { createMockRouter } from '@/stories/routerDecorator'
import { AppRoutes } from '@/config/routes'
import { getMockSafes, getPersonalSafes, hasWorkspace, MOCK_SPACE_ID } from './fixtures'
import { ProPreview } from './ProPreview'
import { DEFAULT_SCENARIO, PLAN_OPTIONS, SCENARIO_KEY, SWITCH_KEY, type Scenario } from './scenario'
import { getShellPageKey, PREVIEW_ROUTE, SHELL_PAGES } from './shellPages'

type Location = { pathname: string; query: Record<string, string> }

const toLocation = (url: Parameters<NextRouter['push']>[0]): Location => {
  if (typeof url !== 'string') {
    const query = typeof url.query === 'object' && url.query ? url.query : {}
    return {
      pathname: url.pathname ?? '/',
      query: Object.fromEntries(Object.entries(query).map(([key, value]) => [key, String(value)])),
    }
  }
  const parsed = new URL(url, 'http://localhost')
  return { pathname: parsed.pathname, query: Object.fromEntries(parsed.searchParams) }
}

const toUrl = ({ pathname, query }: Location): string => {
  const search = Object.entries(query)
    .map(([key, value]) => `${key}=${value}`)
    .join('&')
  return search ? `${pathname}?${search}` : pathname
}

/** A router that holds the address in state, so links and the Safe pickers move between pages inside a story. */
const StoryRouter = ({ start, children }: { start: Location; children: ReactNode }): ReactElement => {
  const [location, setLocation] = useState(start)
  const router = useMemo(() => {
    const go: NextRouter['push'] = async (url) => {
      setLocation(toLocation(url))
      return true
    }
    return createMockRouter({ ...location, route: location.pathname, asPath: toUrl(location), push: go, replace: go })
  }, [location])
  // Storybook hands next/link its own router, so link clicks are picked up here as they bubble.
  const followLink = (event: MouseEvent) => {
    const href = (event.target as HTMLElement).closest('a[href]')?.getAttribute('href')
    if (!href?.startsWith('/')) return
    event.preventDefault()
    void router.push(href)
  }
  return (
    <RouterContext.Provider value={router}>
      <div className="contents" onClick={followLink}>
        {children}
      </div>
    </RouterContext.Provider>
  )
}

/** Stands in for the page. The prototype is the shell only, so the canvas names the page and its address. */
const Canvas = (): ReactElement => {
  const { pathname, query, asPath } = useRouter()
  const key = getShellPageKey(pathname, query.feature)

  if (pathname === PREVIEW_ROUTE || pathname.startsWith(AppRoutes.spaces.index)) return <ProPreview />

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-2 p-6 md:p-10" data-testid="story-canvas">
      <h1 className="text-2xl font-bold">{key ? SHELL_PAGES[key].label : 'Page'}</h1>
      <p className="text-muted-foreground">
        Today&apos;s page renders here, unchanged. This prototype is the app bar and the sidebar only.
      </p>
      <code className="break-all text-sm">{asPath}</code>
    </main>
  )
}

type Args = Pick<Scenario, 'layout' | 'context' | 'plan' | 'safes' | 'role'> & {
  /** Where the story opens: every Safe of the workspace, or its first Safe. */
  start: 'allSafes' | 'safe'
}

const getStart = ({ context, plan, safes, start }: Args): Location => {
  const isWorkspace = context === 'workspace' && hasWorkspace(plan)
  if (start === 'allSafes') {
    return isWorkspace
      ? { pathname: AppRoutes.spaces.index, query: { spaceId: MOCK_SPACE_ID } }
      : { pathname: AppRoutes.welcome.accounts, query: {} }
  }
  const safe = (isWorkspace ? getMockSafes(safes) : getPersonalSafes(safes))[0].safe
  return { pathname: AppRoutes.home, query: { safe, ...(isWorkspace ? { spaceId: MOCK_SPACE_ID } : {}) } }
}

const chains = createChainsPageDataV2(createChainData())
const chainsWithEarn = {
  ...chains,
  results: chains.results.map((chain) => ({ ...chain, features: [...new Set([...chain.features, FEATURES.EARN])] })),
}

const setup = createMockStory({ scenario: 'efSafe', wallet: 'owner', layout: 'fullPage', pathname: AppRoutes.home })

// Earn is off in the mock networks. It is on here, as it is for a Safe that has Earn in its sidebar today.
// First in the list, because the first matching handler wins.
const handlers = [http.get(/\/v2\/chains$/, () => HttpResponse.json(chainsWithEarn)), ...setup.handlers]

const meta = {
  title: 'Prototypes/Unified shell',
  component: Canvas,
  args: {
    layout: DEFAULT_SCENARIO.layout,
    context: DEFAULT_SCENARIO.context,
    plan: DEFAULT_SCENARIO.plan,
    safes: DEFAULT_SCENARIO.safes,
    role: DEFAULT_SCENARIO.role,
    start: 'allSafes',
  },
  argTypes: {
    layout: {
      control: { type: 'inline-radio', labels: { today: 'Today', filter: 'Safe filter' } },
      options: ['today', 'filter'],
    },
    context: {
      control: { type: 'inline-radio', labels: { accounts: 'My accounts', workspace: 'Pro workspace' } },
      options: ['accounts', 'workspace'],
    },
    plan: {
      control: { type: 'select', labels: Object.fromEntries(PLAN_OPTIONS.map((o) => [o.value, o.label])) },
      options: PLAN_OPTIONS.map((o) => o.value),
    },
    safes: { control: 'inline-radio', options: [1, 3, 12] },
    role: { control: 'inline-radio', options: ['admin', 'member'] },
    start: {
      control: { type: 'inline-radio', labels: { allSafes: 'All Safes', safe: 'First Safe' } },
      options: ['allSafes', 'safe'],
    },
  },
  parameters: { layout: 'fullscreen', ...setup.parameters, msw: { handlers } },
  // The state bar, the app bar and the menus move with the pointer and the clock.
  tags: ['skip-visual-test'],
  decorators: [
    setup.decorator,
    (Story, { args }) => {
      const { start: _start, ...scenarioArgs } = args as Args
      const scenario: Scenario = { ...DEFAULT_SCENARIO, ...scenarioArgs, viewport: 'desktop' }
      try {
        window.localStorage.setItem(SWITCH_KEY, 'on')
        window.localStorage.setItem(SCENARIO_KEY, JSON.stringify(scenario))
      } catch {
        // Storage blocked: the page falls back to today's layout.
      }
      return (
        <StoryRouter key={JSON.stringify(args)} start={getStart(args as Args)}>
          <Story />
        </StoryRouter>
      )
    },
  ],
} satisfies Meta<Args>

export default meta
type Story = StoryObj<typeof meta>

/** Where the demo starts: a paid Workspace on All Safes. No This Safe group until a Safe is picked. */
export const ProWorkspace: Story = {}

/** A Safe picked in the Workspace: its own item under the switcher, the address in the bar, and the This Safe group. */
export const ProWorkspaceSafePicked: Story = { args: { start: 'safe' } }

export const ProWorkspaceTwelveSafes: Story = { args: { safes: 12, start: 'safe' } }

/** Members get the same list. Members, Plan and Workspace settings are view only in the switcher menu. */
export const ProWorkspaceMember: Story = { args: { role: 'member', start: 'safe' } }

/** Free with one Safe: today's list in today's order, "New transaction", no All Safes and no × on the Safe. */
export const FreeOneSafe: Story = { args: { plan: 'free', context: 'accounts', safes: 1, start: 'safe' } }

/** Free with several Safes: the button reads "New" and the Workspace group is locked. */
export const FreeSeveralSafes: Story = { args: { plan: 'free', context: 'accounts', start: 'safe' } }

/** All Safes on Free is the account list. Views across Safes are locked previews, the rest ask which Safe. */
export const FreeAllSafes: Story = { args: { plan: 'free', context: 'accounts', start: 'allSafes' } }

/** My accounts stays Free while the Workspace is on Pro. */
export const MyAccountsBesideProWorkspace: Story = { args: { context: 'accounts', start: 'safe' } }

export const Trial: Story = { args: { plan: 'trial', start: 'safe' } }

export const TrialThreeDays: Story = { args: { plan: 'trial-3', start: 'safe' } }

export const TrialLastDay: Story = { args: { plan: 'trial-last', start: 'safe' } }

/** The Workspace group goes back to locked. Every Safe page works as before. */
export const TrialEnded: Story = { args: { plan: 'trial-ended', start: 'safe' } }

/** Production, for comparison: the Safe sidebar and today's header. */
export const TodayMyAccounts: Story = { args: { layout: 'today', context: 'accounts', start: 'safe' } }

/** Production, for comparison: the Workspace sidebar and today's header. */
export const TodayProWorkspace: Story = { args: { layout: 'today', start: 'allSafes' } }

/** Below 900 the sidebar is a drawer and the bar keeps the Safe's name, a one-tap Safe switch and New. */
export const Mobile: Story = { args: { start: 'safe' }, parameters: { viewport: { defaultViewport: 'mobile' } } }
