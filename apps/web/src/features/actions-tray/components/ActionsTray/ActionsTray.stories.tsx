import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import { GeoblockingContext } from '@/components/common/GeoblockingProvider'
import ActionsTray from './ActionsTray'

const meta = {
  title: 'Features/ActionsTray/ActionsTray',
  component: ActionsTray,
  loaders: [mswLoader],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ActionsTray>

export default meta
type Story = StoryObj<typeof meta>

/** Baseline: wallet connected as owner, chain supports NATIVE_SWAPS, user is not geoblocked. */
export const Default: Story = (() => {
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'owner',
    layout: 'paper',
    shadcn: true,
  })
  return {
    args: { noAssets: false, variant: 'space' },
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()

/**
 * The user is accessing the app from a restricted jurisdiction.
 * Send and Swap are disabled with a "… is not allowed for your country" tooltip.
 * Receive and Build transaction remain enabled.
 */
export const ProhibitedLocation: Story = (() => {
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'owner',
    layout: 'paper',
    shadcn: true,
  })
  return {
    args: { noAssets: false, variant: 'space' },
    parameters: { ...setup.parameters },
    decorators: [
      (Story) => (
        <GeoblockingContext.Provider value={true}>
          <Story />
        </GeoblockingContext.Provider>
      ),
      setup.decorator,
    ],
  }
})()
