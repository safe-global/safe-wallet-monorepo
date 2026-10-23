import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { http, HttpResponse } from 'msw'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { createMockStory } from '@/stories/mocks'
import { mockOwnedSafes } from '@/stories/mocks/handlers'
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

const spaceWithSafes = http.get(/\/v1\/spaces\/[^/]+\/safes$/, () => HttpResponse.json({ safes: mockOwnedSafes }))

export const SendFromModal: Story = {
  parameters: { msw: { handlers: [spaceWithSafes, ...defaultSetup.handlers] } },
  play: async ({ canvasElement }) => {
    const sendButton = await within(canvasElement).findByRole('button', { name: 'Send' })
    await waitFor(() => expect(sendButton).toBeEnabled())
    await userEvent.click(sendButton)
    await within(document.body).findByRole('dialog')
  },
}
