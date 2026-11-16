import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { createMockStory } from '@/stories/mocks'
import SpaceTransactionsPage from './Page'
import { QUEUE_SECTIONS, SPACE_QUEUE_URL, toQueuePage } from './SpaceTransactionQueue.storyData'

const SPACE_ID = '1'

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  authenticated: true,
  pathname: '/spaces/transactions',
  query: { spaceId: SPACE_ID },
  layout: 'paper',
  shadcn: true,
  handlers: [http.get(SPACE_QUEUE_URL, () => HttpResponse.json(toQueuePage(QUEUE_SECTIONS)))],
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

/** The Workspace queue: two Safes, a conflict at nonce 57 on Ethereum and a second chain under the first Safe. */
export const Default: Story = {}
