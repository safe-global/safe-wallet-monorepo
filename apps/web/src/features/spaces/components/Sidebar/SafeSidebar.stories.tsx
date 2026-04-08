import type { Meta, StoryObj } from '@storybook/react'
import type { CSSProperties, ReactNode } from 'react'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { withMockProvider } from '@/storybook/preview'
import { createChainData } from '@/stories/mocks'
import { EnhancedSidebar } from './index'
import { SidebarSkeleton } from './SidebarSkeleton'
import { ImplementationVersionState } from '@safe-global/store/gateway/types'
import { cgwClient } from '@safe-global/store/gateway/cgwClient'
import { chainsAdapter, chainsInitialState } from '@safe-global/store/gateway'
import { CONFIG_SERVICE_KEY, DEFAULT_CHAIN_ID } from '@/config/constants'
import chains from '@/config/chains'
import type { RootState } from '@/store'
import type { SpaceItem } from './types'

const defaultChainShortName =
  (Object.entries(chains) as [string, string][]).find(([, id]) => id === String(DEFAULT_CHAIN_ID))?.[0] ?? 'sep'

const SAFE_SIDEBAR_ROUTER_QUERY = {
  spaceId: '1',
  chain: defaultChainShortName,
  safe: '0x1234567890123456789012345678901234567890',
}

const STORY_SELECTED_SPACE: SpaceItem = { id: 1, name: 'Company Space' }

const storyChain = (() => {
  const base = createChainData()
  const id = String(DEFAULT_CHAIN_ID)
  return base.chainId === id ? base : { ...base, chainId: id, shortName: defaultChainShortName }
})()

const safeSidebarStoryState = {
  [cgwClient.reducerPath]: {
    queries: {
      [`getChainsConfigV2("${CONFIG_SERVICE_KEY}")`]: {
        status: 'fulfilled' as const,
        endpointName: 'getChainsConfigV2' as const,
        requestId: 'safe-sidebar-story',
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

const notInSpaceStoryState = {
  ...safeSidebarStoryState,
  auth: {
    sessionExpiresAt: null,
    lastUsedSpace: null,
    isStoreHydrated: true,
  },
} as unknown as Partial<RootState>

const NOT_IN_SPACE_DEMO_SPACES = [
  { id: 101, name: 'Design workspace' },
  { id: 102, name: 'Treasury' },
] as const

const SafeSidebarLayout = ({ children }: { children: ReactNode }) => (
  <SidebarProvider defaultOpen style={{ '--sidebar-width': 'min(230px, 100%)' } as CSSProperties}>
    <div className="flex min-h-screen w-full">
      {children}
      <SidebarInset />
    </div>
  </SidebarProvider>
)

const meta = {
  title: 'Features/Spaces/SafeSidebar',
  component: EnhancedSidebar,
  args: {
    type: 'safe' as const,
    spaceName: 'Company Space',
    spaceInitial: 'C',
  },
  argTypes: {
    type: { control: false },
    spaceName: { control: 'text' },
    spaceInitial: { control: 'text' },
  },
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: false,
      router: {
        pathname: '/home',
        query: SAFE_SIDEBAR_ROUTER_QUERY,
      },
    },
  },
  decorators: [withMockProvider({ initialState: safeSidebarStoryState, shadcn: true })],
} satisfies Meta<typeof EnhancedSidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <SafeSidebarLayout>
      <EnhancedSidebar
        type={args.type}
        spaceName={args.spaceName}
        spaceInitial={args.spaceInitial}
        selectedSpace={STORY_SELECTED_SPACE}
      />
    </SafeSidebarLayout>
  ),
}

const mockTxQueueState = {
  txQueue: {
    loading: false,
    data: {
      results: [{ type: 'TRANSACTION' }, { type: 'TRANSACTION' }, { type: 'TRANSACTION' }],
    },
  },
}

export const WithTransactions: Story = {
  decorators: [withMockProvider({ initialState: { ...safeSidebarStoryState, ...mockTxQueueState }, shadcn: true })],
  render: (args) => (
    <SafeSidebarLayout>
      <EnhancedSidebar
        type={args.type}
        spaceName={args.spaceName}
        spaceInitial={args.spaceInitial}
        selectedSpace={STORY_SELECTED_SPACE}
      />
    </SafeSidebarLayout>
  ),
}

export const TransactionsActive: Story = {
  decorators: [withMockProvider({ initialState: { ...safeSidebarStoryState, ...mockTxQueueState }, shadcn: true })],
  parameters: {
    nextjs: {
      appDirectory: false,
      router: {
        pathname: '/transactions/queue',
        query: SAFE_SIDEBAR_ROUTER_QUERY,
      },
    },
  },
  render: (args) => (
    <SafeSidebarLayout>
      <EnhancedSidebar
        type={args.type}
        spaceName={args.spaceName}
        spaceInitial={args.spaceInitial}
        selectedSpace={STORY_SELECTED_SPACE}
      />
    </SafeSidebarLayout>
  ),
}

const outdatedSafeState = {
  safeInfo: {
    loading: false,
    loaded: true,
    data: {
      implementationVersionState: ImplementationVersionState.OUTDATED,
      version: '1.1.1',
      deployed: true,
      address: { value: '0x1234567890123456789012345678901234567890' },
    },
  },
}

export const OutdatedSafeVersion: Story = {
  decorators: [withMockProvider({ initialState: { ...safeSidebarStoryState, ...outdatedSafeState }, shadcn: true })],
  render: (args) => (
    <SafeSidebarLayout>
      <EnhancedSidebar
        type={args.type}
        spaceName={args.spaceName}
        spaceInitial={args.spaceInitial}
        selectedSpace={STORY_SELECTED_SPACE}
      />
    </SafeSidebarLayout>
  ),
}

const undeployedSafeState = {
  safeInfo: {
    loading: false,
    loaded: true,
    data: {
      implementationVersionState: ImplementationVersionState.UP_TO_DATE,
      version: '1.4.1',
      deployed: false,
      address: { value: '0x1234567890123456789012345678901234567890' },
    },
  },
}

export const UndeployedSafe: Story = {
  decorators: [withMockProvider({ initialState: { ...safeSidebarStoryState, ...undeployedSafeState }, shadcn: true })],
  render: (args) => (
    <SafeSidebarLayout>
      <EnhancedSidebar
        type={args.type}
        spaceName={args.spaceName}
        spaceInitial={args.spaceInitial}
        selectedSpace={STORY_SELECTED_SPACE}
      />
    </SafeSidebarLayout>
  ),
}

export const Skeleton: Story = {
  render: () => (
    <SafeSidebarLayout>
      <SidebarSkeleton />
    </SafeSidebarLayout>
  ),
}

export const NotPartOfSpace: Story = {
  args: {
    spaceName: '',
    spaceInitial: '',
  },
  decorators: [withMockProvider({ initialState: notInSpaceStoryState, shadcn: true })],
  parameters: {
    nextjs: {
      appDirectory: false,
      router: {
        pathname: '/home',
        query: {
          chain: defaultChainShortName,
          safe: '0x1234567890123456789012345678901234567890',
          spaceId: '',
        },
      },
    },
  },
  render: (args) => (
    <SafeSidebarLayout>
      <EnhancedSidebar
        type={args.type}
        spaceName={args.spaceName}
        spaceInitial={args.spaceInitial}
        spaces={[...NOT_IN_SPACE_DEMO_SPACES]}
      />
    </SafeSidebarLayout>
  ),
}
