import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import Licenses from '@/pages/licenses'

/**
 * Licenses page - open source license information.
 * Lists all open source dependencies and their licenses.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'disconnected',
})

const meta = {
  title: 'Pages/Static/Legal/Licenses',
  component: Licenses,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof Licenses>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
