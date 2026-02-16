import type { Meta, StoryObj } from '@storybook/react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { EnhancedSidebar } from './index'

const meta = {
  title: 'Features/Spaces/SpacesSidebar',
  component: EnhancedSidebar,
  args: {
    spaceName: 'CompanyName',
    spaceInitial: 'C',
  },
  argTypes: {
    spaceName: { control: 'text' },
    spaceInitial: { control: 'text' },
  },
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/spaces',
      },
    },
  },
  decorators: [
    (_Story, context) => (
      <SidebarProvider defaultOpen>
        <div className="flex min-h-screen w-full">
          <EnhancedSidebar isSpacesRoute spaceName={context.args.spaceName} spaceInitial={context.args.spaceInitial} />
          <SidebarInset>
            <header className="flex h-14 items-center gap-2 border-b px-4">
              <span className="font-semibold">Example Spaces Content Area</span>
            </header>
            <main className="flex-1 p-4">
              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-2xl font-bold mb-4">Example Spaces Dashboard</h2>
                <p className="text-muted-foreground">
                  Example content area for the Spaces view - not a part of the sidebar.
                </p>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    ),
  ],
} satisfies Meta<typeof EnhancedSidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
