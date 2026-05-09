import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import Welcome from '@/pages/welcome'

/**
 * Welcome page - entry point for new users.
 * Shows options to create or add an existing Safe.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'disconnected',
})

const meta = {
  title: 'Pages/Onboarding/Welcome',
  component: Welcome,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof Welcome>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
