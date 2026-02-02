import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import Offline from '@/pages/_offline'

/**
 * Offline page - no network connection.
 * Displayed when the user is offline.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'disconnected',
})

const meta = {
  title: 'Pages/Static/Error/Offline',
  component: Offline,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof Offline>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
