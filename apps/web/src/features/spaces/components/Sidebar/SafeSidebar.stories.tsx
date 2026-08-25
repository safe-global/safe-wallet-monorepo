import type { Meta, StoryObj } from '@storybook/react'
import type { CSSProperties, ReactNode } from 'react'
import { Sidebar, SidebarHeader, SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { withMockProvider } from '@/storybook/preview'
import { createChainData } from '@/stories/mocks'
import { EnhancedSidebar } from './index'
import { SafeSidebarVariant } from './variants/SafeSidebarVariant'
import { ImplementationVersionState } from '@safe-global/store/gateway/types'
import { cgwClient } from '@safe-global/store/gateway/cgwClient'
import { chainsAdapter, chainsInitialState } from '@safe-global/store/gateway'
import { CONFIG_SERVICE_KEY, DEFAULT_CHAIN_ID } from '@/config/constants'
import chains from '@safe-global/utils/config/chains'
import type { RootState } from '@/store'
import type { ResolvedSidebarItem, ResolvedSidebarGroup, SpaceItem } from './types'
import { AppRoutes } from '@/config/routes'
import { Wallet, Coins, ArrowRightLeft, BookUser, LayoutGrid, Repeat2, Orbit, Database, TrendingUp } from 'lucide-react'

const defaultChainShortName =
  (Object.entries(chains) as [string, string][]).find(([, id]) => id === String(DEFAULT_CHAIN_ID))?.[0] ?? 'sep'

const SAFE_SIDEBAR_ROUTER_QUERY = {
  spaceId: 'uuid-1',
  chain: defaultChainShortName,
  safe: '0x1234567890123456789012345678901234567890',
}

const STORY_SELECTED_SPACE: SpaceItem = { uuid: 'uuid-1', name: 'Company Space', safeCount: 0 }

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
    spaceInitial: 'C',
  },
  argTypes: {
    type: { control: false },
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
      <EnhancedSidebar type={args.type} spaceInitial={args.spaceInitial} selectedSpace={STORY_SELECTED_SPACE} />
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
      <EnhancedSidebar type={args.type} spaceInitial={args.spaceInitial} selectedSpace={STORY_SELECTED_SPACE} />
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
      <EnhancedSidebar type={args.type} spaceInitial={args.spaceInitial} selectedSpace={STORY_SELECTED_SPACE} />
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
      owners: [],
      threshold: 1,
    },
  },
}

export const OutdatedSafeVersion: Story = {
  decorators: [withMockProvider({ initialState: { ...safeSidebarStoryState, ...outdatedSafeState }, shadcn: true })],
  render: (args) => (
    <SafeSidebarLayout>
      <EnhancedSidebar type={args.type} spaceInitial={args.spaceInitial} selectedSpace={STORY_SELECTED_SPACE} />
    </SafeSidebarLayout>
  ),
}

export const Skeleton: Story = {
  render: (args) => (
    <SafeSidebarLayout>
      <EnhancedSidebar
        type={args.type}
        spaceInitial={args.spaceInitial}
        selectedSpace={STORY_SELECTED_SPACE}
        isLoading
      />
    </SafeSidebarLayout>
  ),
}

// ─── SafeSidebarVariant stories ──────────────────────────────────────────────

const VARIANT_SAFE_ADDRESS = '0x1234567890123456789012345678901234567890'
const VARIANT_CHAIN_ID = '11155111'
const variantQuery = { safe: `eth:${VARIANT_SAFE_ADDRESS}`, spaceId: '1' }

const variantMainNavItems: ResolvedSidebarItem[] = [
  {
    icon: Wallet,
    label: 'Overview',
    href: AppRoutes.home,
    isActive: false,
    disabled: false,
    link: { pathname: AppRoutes.home, query: variantQuery },
  },
  {
    icon: Coins,
    label: 'Assets',
    href: AppRoutes.balances.index,
    isActive: false,
    disabled: false,
    link: { pathname: AppRoutes.balances.index, query: variantQuery },
  },
  {
    icon: ArrowRightLeft,
    label: 'Transactions',
    href: AppRoutes.transactions.history,
    isActive: false,
    disabled: false,
    link: { pathname: AppRoutes.transactions.history, query: variantQuery },
  },
  {
    icon: BookUser,
    label: 'Address book',
    href: AppRoutes.addressBook,
    isActive: false,
    disabled: false,
    link: { pathname: AppRoutes.addressBook, query: variantQuery },
  },
  {
    icon: LayoutGrid,
    label: 'Apps',
    href: AppRoutes.apps.index,
    isActive: false,
    disabled: false,
    link: { pathname: AppRoutes.apps.index, query: variantQuery },
  },
]

const variantDefiGroup: ResolvedSidebarGroup = {
  label: 'Defi',
  items: [
    {
      icon: Repeat2,
      label: 'Swap',
      href: AppRoutes.swap,
      isActive: false,
      disabled: false,
      link: { pathname: AppRoutes.swap, query: variantQuery },
    },
    {
      icon: Orbit,
      label: 'Bridge',
      href: AppRoutes.bridge,
      isActive: false,
      disabled: false,
      link: { pathname: AppRoutes.bridge, query: variantQuery },
    },
    {
      icon: Database,
      label: 'Earn',
      href: AppRoutes.earn,
      isActive: false,
      disabled: false,
      link: { pathname: AppRoutes.earn, query: variantQuery },
    },
    {
      icon: TrendingUp,
      label: 'Stake',
      href: AppRoutes.stake,
      isActive: false,
      disabled: false,
      link: { pathname: AppRoutes.stake, query: variantQuery },
    },
  ],
}

const variantCounterfactualState = {
  safeInfo: {
    loading: false,
    loaded: true,
    data: {
      implementationVersionState: 'UP_TO_DATE',
      version: '1.4.1',
      deployed: false,
      address: { value: VARIANT_SAFE_ADDRESS },
      chainId: VARIANT_CHAIN_ID,
      owners: [],
      threshold: 1,
    },
  },
  undeployedSafes: {
    [VARIANT_CHAIN_ID]: {
      [VARIANT_SAFE_ADDRESS]: {
        props: {},
        status: { status: 'AWAITING_EXECUTION', type: 'RELAYER' },
      },
    },
  },
}

const VariantLayout = ({ children }: { children: ReactNode }) => (
  <SidebarProvider defaultOpen style={{ '--sidebar-width': 'min(230px, 100%)' } as CSSProperties}>
    <div className="flex min-h-screen w-full">
      <Sidebar
        collapsible="icon"
        variant="floating"
        className="!p-0 border-r-0 [&_[data-slot=sidebar-inner]]:rounded-none [&_[data-slot=sidebar-inner]]:rounded-tr-[8px] [&_[data-slot=sidebar-inner]]:rounded-br-[8px] [&_[data-slot=sidebar-inner]]:shadow-[0_2px_8px_rgba(23,23,23,0.06)]"
      >
        <SidebarHeader />
        {children}
      </Sidebar>
      <SidebarInset />
    </div>
  </SidebarProvider>
)

export const VariantBackToSpace: Story = {
  render: () => (
    <VariantLayout>
      <SafeSidebarVariant
        workspaceHeader={{ variant: 'backToSpace', spaceName: 'Company Space', spaceInitial: 'C', spaceId: '1' }}
        mainNavItems={variantMainNavItems}
        defiGroup={variantDefiGroup}
      />
    </VariantLayout>
  ),
}

export const VariantAddToWorkspace: Story = {
  render: () => (
    <VariantLayout>
      <SafeSidebarVariant
        workspaceHeader={{
          variant: 'addToWorkspace',
          spaces: [
            { uuid: 'uuid-1', name: 'Company Space', safeCount: 2 },
            { uuid: 'uuid-2', name: 'Treasury', safeCount: 5 },
          ],
        }}
        mainNavItems={variantMainNavItems}
        defiGroup={variantDefiGroup}
      />
    </VariantLayout>
  ),
}

export const VariantCounterfactualSafe: Story = {
  decorators: [withMockProvider({ initialState: variantCounterfactualState, shadcn: true })],
  parameters: {
    nextjs: {
      appDirectory: false,
      router: { pathname: '/home', query: { safe: VARIANT_SAFE_ADDRESS } },
    },
  },
  render: () => (
    <VariantLayout>
      <SafeSidebarVariant
        workspaceHeader={{ variant: 'addToWorkspace' }}
        mainNavItems={variantMainNavItems}
        defiGroup={{ label: 'Defi', items: [] }}
      />
    </VariantLayout>
  ),
}

export const NotPartOfSpace: Story = {
  args: {
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
      <EnhancedSidebar type={args.type} spaceInitial={args.spaceInitial} spaces={[]} />
    </SafeSidebarLayout>
  ),
}
