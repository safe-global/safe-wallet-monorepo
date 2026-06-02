import type { Meta, StoryObj } from '@storybook/react'
import type { CSSProperties, ReactNode } from 'react'
import { SidebarProvider, Sidebar } from '@/components/ui/sidebar'
import { withMockProvider } from '@/storybook/preview'
import { SidebarProfileView } from './SidebarProfileSection'

const SidebarWrapper = ({ children }: { children: ReactNode }) => (
  <SidebarProvider
    defaultOpen
    style={
      {
        '--sidebar-width': 'min(230px, 100%)',
      } as CSSProperties
    }
  >
    <div className="flex min-h-[400px] w-full p-4">
      <Sidebar
        collapsible="icon"
        variant="floating"
        className="!p-0 border-r-0 group-data-[side=left]:border-r-0 [&_[data-slot=sidebar-inner]]:rounded-none [&_[data-slot=sidebar-inner]]:rounded-tr-[8px] [&_[data-slot=sidebar-inner]]:rounded-br-[8px] [&_[data-slot=sidebar-inner]]:shadow-[0_2px_8px_rgba(23,23,23,0.06)]"
      >
        <div className="flex-1" />
        {children}
      </Sidebar>
    </div>
  </SidebarProvider>
)

const meta = {
  title: 'Features/Spaces/SidebarProfileSection',
  component: SidebarProfileView,
  decorators: [
    withMockProvider({ shadcn: true }),
    (Story) => (
      <SidebarWrapper>
        <Story />
      </SidebarWrapper>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SidebarProfileView>

export default meta
type Story = StoryObj<typeof meta>

export const Member: Story = {
  args: {
    profileName: 'Alice',
    displayName: 'Alice',
    role: 'member',
    onSignOut: () => {},
  },
}

export const Admin: Story = {
  args: {
    profileName: 'Bob',
    displayName: '0x3e7c...C0a7',
    role: 'admin',
    onSignOut: () => {},
  },
}

export const LongName: Story = {
  args: {
    profileName: 'Alexander Maximilian von Rothschild III',
    displayName: 'Alexander Maximilian von Rothschild III',
    role: 'member',
    onSignOut: () => {},
  },
}

export const WalletUser: Story = {
  args: {
    profileName: 'Alice',
    displayName: '0x1234...7890',
    role: 'admin',
    onSignOut: () => {},
  },
}

export const EmailUser: Story = {
  args: {
    profileName: 'alice@example.com',
    displayName: 'alice@example.com',
    role: 'member',
    onSignOut: () => {},
  },
}

export const LongEmail: Story = {
  args: {
    profileName: 'alice.long.email.address@example-enterprise-customer.com',
    displayName: 'alice.long.email.address@example-enterprise-customer.com',
    role: 'member',
    onSignOut: () => {},
  },
}
