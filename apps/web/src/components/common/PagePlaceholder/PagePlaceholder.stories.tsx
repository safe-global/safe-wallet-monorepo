import type { Meta, StoryObj } from '@storybook/react'
import { Inbox, CircleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PagePlaceholder from './index'

const meta: Meta<typeof PagePlaceholder> = {
  title: 'Components/Common/PagePlaceholder',
  component: PagePlaceholder,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="flex min-h-[300px] min-w-[400px] items-center rounded-lg bg-card p-8">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: {
    img: <Inbox className="size-16 text-muted-foreground" />,
    text: 'No transactions found',
  },
}

export const Error: Story = {
  args: {
    img: <CircleAlert className="size-16 text-destructive" />,
    text: 'Something went wrong. Please try again.',
    children: <Button className="mt-4">Retry</Button>,
  },
}
