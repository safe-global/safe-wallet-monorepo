import type { Meta, StoryObj } from '@storybook/react'
import type { CSSProperties, ReactNode } from 'react'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { withMockProvider } from '@/storybook/preview'
import { EnhancedSidebar } from './index'
import { SidebarSkeleton } from './SidebarSkeleton'

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
    spaceName: 'CompanyName',
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
        query: {
          spaceId: '1',
          safe: 'eth:0x1234567890123456789012345678901234567890',
        },
      },
    },
  },
  decorators: [withMockProvider({ shadcn: true })],
} satisfies Meta<typeof EnhancedSidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <SafeSidebarLayout>
      <EnhancedSidebar type={args.type} spaceName={args.spaceName} spaceInitial={args.spaceInitial} />
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
  decorators: [withMockProvider({ initialState: mockTxQueueState })],
  render: (args) => (
    <SafeSidebarLayout>
      <EnhancedSidebar type={args.type} spaceName={args.spaceName} spaceInitial={args.spaceInitial} />
    </SafeSidebarLayout>
  ),
}

export const TransactionsActive: Story = {
  decorators: [withMockProvider({ initialState: mockTxQueueState })],
  parameters: {
    nextjs: {
      appDirectory: false,
      router: {
        pathname: '/transactions/queue',
        query: {
          spaceId: '1',
          safe: 'eth:0x1234567890123456789012345678901234567890',
        },
      },
    },
  },
  render: (args) => (
    <SafeSidebarLayout>
      <EnhancedSidebar type={args.type} spaceName={args.spaceName} spaceInitial={args.spaceInitial} />
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
