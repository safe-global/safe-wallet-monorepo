import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import Custom403 from '@/pages/403'

/**
 * 403 Forbidden page - access restricted error page.
 * Displayed when users try to access content unavailable in their region.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'disconnected',
})

const meta = {
  title: 'Pages/Static/Error/403',
  component: Custom403,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof Custom403>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
