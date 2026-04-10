import type { Meta, StoryObj } from '@storybook/react'
import type { CSSProperties } from 'react'
import { SidebarProvider, Sidebar, SidebarFooter } from '@/components/ui/sidebar'
import { withMockProvider } from '@/storybook/preview'
import { ApiCtaSidebar } from './ApiCtaSidebar'

const SidebarWrapper = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider
    defaultOpen
    style={
      {
        '--sidebar-width': 'min(230px, 100%)',
      } as CSSProperties
    }
  >
    <div className="flex min-h-screen w-full p-4">
      <Sidebar
        collapsible="icon"
        variant="floating"
        className="!p-0 border-r-0 group-data-[side=left]:border-r-0 [&_[data-slot=sidebar-inner]]:rounded-none [&_[data-slot=sidebar-inner]]:rounded-tr-[8px] [&_[data-slot=sidebar-inner]]:rounded-br-[8px] [&_[data-slot=sidebar-inner]]:shadow-[0_2px_8px_rgba(23,23,23,0.06)]"
      >
        <SidebarFooter>{children}</SidebarFooter>
      </Sidebar>
    </div>
  </SidebarProvider>
)

const meta = {
  title: 'Features/Spaces/ApiCtaSidebar',
  component: ApiCtaSidebar,
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
} satisfies Meta<typeof ApiCtaSidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Expanded: Story = {
  parameters: {
    localStorage: { 'api-cta-sidebar-collapsed': false },
  },
}

export const Collapsed: Story = {
  parameters: {
    localStorage: { 'api-cta-sidebar-collapsed': true },
  },
}
