import type { Meta, StoryObj } from '@storybook/react'
import { delay, http, HttpResponse } from 'msw'
import { createMockStory } from '@/stories/mocks/createMockStory'
import SpaceTransactionsPage from './Page'
import { QUEUE_SECTIONS, SPACE_QUEUE_URL, TX_DETAILS_HANDLER, toQueuePage } from './SpaceTransactionQueue.storyData'

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
  // Ahead of the defaults, which already answer every transaction details request
  parameters: { ...setup.parameters, msw: { handlers: [TX_DETAILS_HANDLER, ...setup.handlers] } },
  decorators: [setup.decorator],
} satisfies Meta<typeof SpaceTransactionsPage>

export default meta
type Story = StoryObj<typeof meta>

/** The Workspace queue: two Safes, a conflict at nonce 57 on Ethereum and a second chain under the first Safe. */
export const Default: Story = {}

/**
 * A search is loading: the last queue stays on screen, dimmed and inert, with an "Updating results…" status.
 * The searched queue never answers, so the screenshot holds this state.
 */
export const UpdatingResults: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(SPACE_QUEUE_URL, async ({ request }) => {
          if (new URL(request.url).searchParams.has('search')) await delay('infinite')
          return HttpResponse.json(toQueuePage(QUEUE_SECTIONS))
        }),
        ...setup.handlers,
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const { userEvent, within } = await import('storybook/test')
    const canvas = within(canvasElement)
    await canvas.findByTestId('space-queue-body', {}, { timeout: 5000 })
    await userEvent.type(canvas.getByRole('textbox', { name: 'Search transactions' }), 'treasury')
    await canvas.findByText('Updating results…', {}, { timeout: 3000 })
  },
}
