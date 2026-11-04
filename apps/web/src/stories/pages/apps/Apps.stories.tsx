import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { createMockStory } from '@/stories/mocks'
import Apps from '@/pages/apps'

/**
 * Safe Apps list page - browse and discover Safe Apps.
 * Shows available Safe Apps organized by category.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/apps',
})

const meta = {
  title: 'Pages/Apps',
  component: Apps,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof Apps>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const SearchResults: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(await canvas.findByLabelText('Search Safe App by name'), 'Transaction Builder')
    await waitFor(() => expect(canvas.queryByText(/Featured apps/)).not.toBeInTheDocument())
  },
}
