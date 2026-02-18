import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import LoadSafe from '@/pages/new-safe/load'

/**
 * Load Safe page - add existing Safe.
 * Allows users to add an existing Safe to their account.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
})

const meta = {
  title: 'Pages/Onboarding/NewSafe/Load',
  component: LoadSafe,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof LoadSafe>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
