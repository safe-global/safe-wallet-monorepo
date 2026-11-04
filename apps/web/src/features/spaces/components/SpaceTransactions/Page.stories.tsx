import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory } from '@/stories/mocks'
import SpaceTransactionsPage from './Page'

const SPACE_ID = '1'

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  features: { spaces: true },
  pathname: '/spaces/transactions',
  query: { spaceId: SPACE_ID },
  layout: 'paper',
  shadcn: true,
})

const meta = {
  title: 'Features/Spaces/Transactions/SpaceTransactionsPage',
  component: SpaceTransactionsPage,
  args: { spaceId: SPACE_ID },
  parameters: { ...setup.parameters },
  decorators: [setup.decorator],
} satisfies Meta<typeof SpaceTransactionsPage>

export default meta
type Story = StoryObj<typeof meta>

/** Placeholder page: only the heading until the Space queue is built. */
export const Default: Story = {}
