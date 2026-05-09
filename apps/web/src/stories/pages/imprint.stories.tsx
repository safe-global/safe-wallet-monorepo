import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import Imprint from '@/pages/imprint'

/**
 * Imprint page - legal entity information.
 * Company information and legal disclosures.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'disconnected',
})

const meta = {
  title: 'Pages/Static/Legal/Imprint',
  component: Imprint,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof Imprint>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
