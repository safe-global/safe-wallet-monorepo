import type { Meta, StoryObj } from '@storybook/react'
import { Plus, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PageHeader from './index'

const meta = {
  title: 'Components/Common/PageHeader',
  component: PageHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PageHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Transactions',
  },
}

export const WithButton: Story = {
  args: {
    title: 'Address book',
    action: (
      <Button>
        <Plus className="size-4" />
        Add entry
      </Button>
    ),
  },
}

export const WithIconButton: Story = {
  args: {
    title: 'Settings',
    action: (
      <Button variant="ghost" size="icon">
        <Settings className="size-4" />
      </Button>
    ),
  },
}

export const NoBorder: Story = {
  args: {
    title: 'My Assets',
    noBorder: true,
  },
}

export const LongTitle: Story = {
  args: {
    title: 'Transaction queue and history overview',
    action: <Button variant="outline">Export</Button>,
  },
}
