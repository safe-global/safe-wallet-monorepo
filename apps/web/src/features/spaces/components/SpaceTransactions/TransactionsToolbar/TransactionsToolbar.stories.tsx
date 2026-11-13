import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory } from '@/stories/mocks'
import TransactionsToolbar from './TransactionsToolbar'

const setup = createMockStory({ scenario: 'efSafe', wallet: 'owner', layout: 'paper', shadcn: true })

const meta = {
  title: 'Features/Spaces/Transactions/TransactionsToolbar',
  component: TransactionsToolbar,
  args: { spaceId: '1' },
  parameters: { ...setup.parameters },
  decorators: [setup.decorator],
} satisfies Meta<typeof TransactionsToolbar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
