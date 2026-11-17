import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import { userEvent, within } from 'storybook/test'
import { createMockStory } from '@/stories/mocks'
import Queue from '@/pages/transactions/queue'
import { queueFixtures } from '@safe-global/test/msw/fixtures'

/**
 * Transaction Queue page - displays pending transactions awaiting signatures or execution.
 * Includes batch execution controls and recovery list.
 */

const meta = {
  title: 'Pages/Core/Transactions/Queue',
  component: Queue,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Queue>

export default meta
type Story = StoryObj<typeof meta>

const queueConfig = {
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/transactions/queue',
} as const

const setup = createMockStory(queueConfig)

const pendingBatchSetup = createMockStory({
  ...queueConfig,
  store: { txQueue: { data: queueFixtures.pendingBatch, loading: false, loaded: true } },
})

// MSW is first-match-wins, so the queued batch handlers go before the defaults
const pendingBatchHandlers = [
  http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/transactions\/queued/, () =>
    HttpResponse.json(queueFixtures.pendingBatch),
  ),
  http.get(/\/v1\/chains\/\d+\/transactions\//, () => HttpResponse.json(queueFixtures.batchAwaiting)),
]

const pendingBatchStory: Story = {
  parameters: {
    ...pendingBatchSetup.parameters,
    msw: { handlers: [...pendingBatchHandlers, ...pendingBatchSetup.handlers] },
  },
  decorators: [pendingBatchSetup.decorator],
}

const expandFirstBatch = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  const [batch] = await canvas.findAllByText('Batch')
  await userEvent.click(batch)
  return canvas.findByTestId('expande-all-btn')
}

export const Default: Story = {
  parameters: { ...setup.parameters },
  decorators: [setup.decorator],
}

export const QueuedBatchExpanded: Story = {
  ...pendingBatchStory,
  play: async ({ canvasElement }) => {
    await expandFirstBatch(canvasElement)
  },
}

export const QueuedBatchActionsExpanded: Story = {
  ...pendingBatchStory,
  play: async ({ canvasElement }) => {
    await userEvent.click(await expandFirstBatch(canvasElement))
  },
}
