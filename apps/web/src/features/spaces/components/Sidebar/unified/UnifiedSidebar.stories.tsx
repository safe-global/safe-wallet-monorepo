import type { Meta, StoryObj } from '@storybook/react'
import type { CSSProperties } from 'react'
import { SidebarInset, SidebarProvider } from '@safe-global/views/components/ui/sidebar'
import { withMockProvider } from '@/storybook/decorators'
import { createChainData } from '@/stories/mocks'
import { cgwClient } from '@safe-global/store/gateway/cgwClient'
import { chainsAdapter, chainsInitialState } from '@safe-global/store/gateway'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import type { RootState } from '@/store'
import { EnhancedSidebar } from '../index'
import { DEFAULT_SCENARIO, PLAN_OPTIONS, type Scenario } from './scenario'

// Same keys as scenario.ts. Stories write them directly so each story opens in its own state.
const SWITCH_KEY = 'unifiedSidebarPrototype'
const SCENARIO_KEY = 'unifiedSidebarPrototype.scenario'

// Treasury, the first mock Safe in fixtures.ts.
const SAFE = 'sep:0xBd69b0a9DC90eB6F9bAc3E4a5875f437348b6415'

const storyChain = { ...createChainData(), chainId: '11155111', shortName: 'sep' }

const storyState = {
  [cgwClient.reducerPath]: {
    queries: {
      [`getChainsConfigV2("${CONFIG_SERVICE_KEY}")`]: {
        status: 'fulfilled' as const,
        endpointName: 'getChainsConfigV2' as const,
        requestId: 'unified-sidebar-story',
        originalArgs: CONFIG_SERVICE_KEY,
        startedTimeStamp: Date.now(),
        data: chainsAdapter.setAll(chainsInitialState, [storyChain]),
        fulfilledTimeStamp: Date.now(),
        error: undefined,
      },
    },
    mutations: {},
    provided: { tags: {}, keys: {} },
    subscriptions: {},
    config: {
      online: true,
      focused: true,
      middlewareRegistered: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
      refetchOnMountOrArgChange: false,
      keepUnusedDataFor: 60,
      reducerPath: cgwClient.reducerPath,
      invalidationBehavior: 'delayed' as const,
    },
  },
} as unknown as Partial<RootState>

type Args = Pick<Scenario, 'plan' | 'safes' | 'role' | 'context'>

const UnifiedSidebarStory = (args: Args) => {
  const scenario: Scenario = { ...DEFAULT_SCENARIO, ...args, viewport: 'desktop' }
  try {
    window.localStorage.setItem(SWITCH_KEY, 'on')
    window.localStorage.setItem(SCENARIO_KEY, JSON.stringify(scenario))
  } catch {
    // Storage blocked: the sidebar falls back to today's layout.
  }

  return (
    <SidebarProvider
      key={JSON.stringify(scenario)}
      defaultOpen
      style={{ '--sidebar-width': 'min(230px, 100%)' } as CSSProperties}
    >
      <div className="flex min-h-screen w-full">
        <EnhancedSidebar type="safe" spaceInitial="A" />
        <SidebarInset />
      </div>
    </SidebarProvider>
  )
}

const meta = {
  title: 'Prototypes/Unified sidebar',
  component: UnifiedSidebarStory,
  args: {
    plan: DEFAULT_SCENARIO.plan,
    safes: DEFAULT_SCENARIO.safes,
    role: DEFAULT_SCENARIO.role,
    context: DEFAULT_SCENARIO.context,
  },
  argTypes: {
    plan: {
      control: { type: 'select', labels: Object.fromEntries(PLAN_OPTIONS.map((o) => [o.value, o.label])) },
      options: PLAN_OPTIONS.map((o) => o.value),
    },
    safes: { control: 'inline-radio', options: [1, 3, 12] },
    role: { control: 'inline-radio', options: ['admin', 'member'] },
    context: {
      control: { type: 'inline-radio', labels: { accounts: 'My accounts', workspace: 'Workspace (Acme)' } },
      options: ['accounts', 'workspace'],
    },
  },
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: false, router: { pathname: '/home', query: { safe: SAFE } } },
  },
  decorators: [withMockProvider({ initialState: storyState, shadcn: true })],
} satisfies Meta<typeof UnifiedSidebarStory>

export default meta
type Story = StoryObj<typeof meta>

/** A free user with no Workspace: Safe Pro items are locked and the switcher offers the trial. */
export const Free: Story = { args: { plan: 'free', context: 'accounts' } }

/** Same person inside the free "My accounts" side while their Workspace is on Pro. */
export const MyAccountsWithProWorkspace: Story = { args: { plan: 'paid', context: 'accounts' } }

export const WorkspaceTrial: Story = { args: { plan: 'trial', context: 'workspace' } }

export const WorkspaceTrialLastDay: Story = { args: { plan: 'trial-last', context: 'workspace' } }

export const WorkspacePaid: Story = { args: { plan: 'paid', context: 'workspace', safes: 12 } }

export const WorkspaceTrialEnded: Story = { args: { plan: 'trial-ended', context: 'workspace' } }

export const WorkspaceMember: Story = { args: { plan: 'free', role: 'member', context: 'accounts' } }
