import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import SafeLabsTerms from '@/pages/safe-labs-terms'

/**
 * Safe Labs Terms page - additional terms for Safe Labs services.
 * Displays specific terms and conditions for Safe Labs.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'disconnected',
})

const meta = {
  title: 'Pages/Static/Legal/SafeLabsTerms',
  component: SafeLabsTerms,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof SafeLabsTerms>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
