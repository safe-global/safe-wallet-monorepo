import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { createMockStory } from '@/stories/mocks'
import { spaceWithSafesHandler } from '@/stories/mocks/handlers'
import SpaceDashboard from '@/pages/spaces'

/**
 * Space Dashboard page - overview of a Space.
 * Shows Space summary, recent activity, and quick actions.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
  layout: 'fullPage',
  pathname: '/spaces',
  features: { spaces: true },
  query: { spaceId: '1' },
  shadcn: true,
})

const meta = {
  title: 'Pages/Spaces/Dashboard',
  component: SpaceDashboard,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof SpaceDashboard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithSafes: Story = {
  parameters: { msw: { handlers: [spaceWithSafesHandler, ...defaultSetup.handlers] } },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findAllByText(/0xA77D/)
  },
}

export const SendFromModal: Story = {
  parameters: { msw: { handlers: [spaceWithSafesHandler, ...defaultSetup.handlers] } },
  play: async ({ canvasElement }) => {
    const sendButton = await within(canvasElement).findByRole('button', { name: 'Send' })
    await waitFor(() => expect(sendButton).toBeEnabled())
    await userEvent.click(sendButton)
    await within(document.body).findByRole('dialog')
  },
}
