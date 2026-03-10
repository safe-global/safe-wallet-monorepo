import type { Meta, StoryObj } from '@storybook/react'
import BackLink from './index'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const meta = {
  component: BackLink,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="flex items-stretch" style={{ height: 84, backgroundColor: '#f4f4f4', padding: 16, borderRadius: 8 }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof BackLink>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onClick: () => console.log('back clicked'),
    children: (
      <Avatar className="size-8 shrink-0">
        <AvatarFallback
          className="rounded-md text-primary-foreground text-sm font-semibold"
          style={{ backgroundColor: 'hsl(137, 55%, 55%)' }}
        >
          A
        </AvatarFallback>
      </Avatar>
    ),
  },
}
