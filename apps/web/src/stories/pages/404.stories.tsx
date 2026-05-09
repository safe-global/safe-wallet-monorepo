import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import Custom404 from '@/pages/404'

/**
 * 404 Not Found page - page not found error.
 * Displayed when users navigate to a non-existent page.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'disconnected',
})

const meta = {
  title: 'Pages/Static/Error/404',
  component: Custom404,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof Custom404>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
