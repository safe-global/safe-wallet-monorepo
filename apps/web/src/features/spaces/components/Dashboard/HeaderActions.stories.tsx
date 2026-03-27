import type { Meta, StoryObj } from '@storybook/react'
import { MoreVertical } from 'lucide-react'
import { ShadcnProvider } from '@/components/ui/ShadcnProvider'
import { Button } from '@/components/ui/button'
import { HeaderActions } from './HeaderActions'

const meta = {
  title: 'Features/Spaces/HeaderActions',
  component: HeaderActions,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story, context) => {
      const isDark = (context.globals?.theme as string) === 'dark'
      return (
        <ShadcnProvider dark={isDark}>
          <div className="bg-muted p-6 min-w-[1000px]">
            <Story />
          </div>
        </ShadcnProvider>
      )
    },
  ],
} satisfies Meta<typeof HeaderActions>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onSend: () => {},
    onReceive: () => {},
    onSwap: () => {},
    onBuildTransaction: () => {},
  },
}

export const ManageSafe: Story = {
  args: {
    ...Default.args,
    otherActions: (
      <Button variant="ghost" size="sm" className="text-muted-foreground">
        <MoreVertical className="size-4 text-foreground" />
        Manage Safe
      </Button>
    ),
  },
}
