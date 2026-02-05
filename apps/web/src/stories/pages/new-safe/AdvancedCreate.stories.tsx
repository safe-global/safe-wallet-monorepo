import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import AdvancedCreateSafe from '@/pages/new-safe/advanced-create'

/**
 * Advanced Create Safe page - create Safe with custom settings.
 * Allows configuration of owners, threshold, and modules.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
})

const meta = {
  title: 'Pages/Onboarding/NewSafe/AdvancedCreate',
  component: AdvancedCreateSafe,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof AdvancedCreateSafe>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
