import type { Meta, StoryObj } from '@storybook/react'
import { House, ArrowRightLeft, WalletCards, BookUser, UsersRound, Shield, Settings } from 'lucide-react'
import { SidebarProvider, Sidebar, SidebarHeader } from '@/components/ui/sidebar'
import { AppRoutes } from '@/config/routes'
import { SpacesSidebarVariant } from './variants/SpacesSidebarVariant'
import { SidebarTopBar } from './SidebarTopBar'
import { SidebarCommonFooter } from './SidebarCommonFooter'
import type { ResolvedSidebarItem, ResolvedSidebarGroup } from './types'

const mockSpaceId = '1'

const mockMainNavItems: ResolvedSidebarItem[] = [
  {
    icon: House,
    label: 'Home',
    href: AppRoutes.spaces.index,
    isActive: true,
    disabled: false,
    link: { pathname: AppRoutes.spaces.index, query: { spaceId: mockSpaceId } },
  },
  {
    icon: ArrowRightLeft,
    label: 'Transactions',
    href: AppRoutes.spaces.transactions,
    badge: 1,
    isActive: false,
    disabled: false,
    link: { pathname: AppRoutes.spaces.transactions, query: { spaceId: mockSpaceId } },
  },
  {
    icon: WalletCards,
    label: 'Accounts',
    href: AppRoutes.spaces.safeAccounts,
    isActive: false,
    disabled: false,
    link: { pathname: AppRoutes.spaces.safeAccounts, query: { spaceId: mockSpaceId } },
  },
  {
    icon: BookUser,
    label: 'Address book',
    href: AppRoutes.spaces.addressBook,
    isActive: false,
    disabled: false,
    link: { pathname: AppRoutes.spaces.addressBook, query: { spaceId: mockSpaceId } },
  },
]

const mockSetupGroup: ResolvedSidebarGroup = {
  label: 'Setup',
  items: [
    {
      icon: UsersRound,
      label: 'Team',
      href: AppRoutes.spaces.members,
      isActive: false,
      disabled: false,
      link: { pathname: AppRoutes.spaces.members, query: { spaceId: mockSpaceId } },
    },
    {
      icon: Shield,
      label: 'Security',
      href: AppRoutes.spaces.security,
      isActive: false,
      disabled: false,
      link: { pathname: AppRoutes.spaces.security, query: { spaceId: mockSpaceId } },
    },
    {
      icon: Settings,
      label: 'Settings',
      href: AppRoutes.spaces.settings,
      isActive: false,
      disabled: false,
      link: { pathname: AppRoutes.spaces.settings, query: { spaceId: mockSpaceId } },
    },
  ],
}

const mockDisabledSetupGroup: ResolvedSidebarGroup = {
  ...mockSetupGroup,
  items: mockSetupGroup.items.map((item) =>
    item.href === AppRoutes.spaces.security || item.href === AppRoutes.spaces.settings
      ? { ...item, disabled: true }
      : item,
  ),
}

const mockSpaces = [
  { id: 1, name: 'Company Space' },
  { id: 2, name: 'Personal Space' },
]

const selectedSpace = mockSpaces[0]

const SPACES_SIDEBAR_WIDTH = 'min(230px, 100%)'

const SidebarWrapper = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider
    defaultOpen
    style={
      {
        '--sidebar-width': SPACES_SIDEBAR_WIDTH,
      } as React.CSSProperties
    }
  >
    <div className="flex min-h-screen w-full p-4">
      <Sidebar collapsible="icon" variant="sidebar" className="!border-r-0 rounded-lg border">
        <SidebarHeader>
          <SidebarTopBar />
        </SidebarHeader>
        {children}
        <SidebarCommonFooter />
      </Sidebar>
    </div>
  </SidebarProvider>
)

const meta = {
  title: 'Features/Spaces/SpacesSidebar',
  component: SpacesSidebarVariant,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SpacesSidebarVariant>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    mainNavItems: mockMainNavItems,
    setupGroup: mockSetupGroup,
    selectedSpace,
    spaces: mockSpaces,
  },
  decorators: [
    (Story) => (
      <SidebarWrapper>
        <Story />
      </SidebarWrapper>
    ),
  ],
}

export const NonActiveMember: Story = {
  args: {
    mainNavItems: mockMainNavItems,
    setupGroup: mockDisabledSetupGroup,
    selectedSpace,
    spaces: mockSpaces,
  },
  decorators: [
    (Story) => (
      <SidebarWrapper>
        <Story />
      </SidebarWrapper>
    ),
  ],
}

export const TransactionsActive: Story = {
  args: {
    mainNavItems: mockMainNavItems.map((item) => ({
      ...item,
      isActive: item.href === AppRoutes.spaces.transactions,
    })),
    setupGroup: mockSetupGroup,
    selectedSpace,
    spaces: mockSpaces,
  },
  decorators: [
    (Story) => (
      <SidebarWrapper>
        <Story />
      </SidebarWrapper>
    ),
  ],
}
