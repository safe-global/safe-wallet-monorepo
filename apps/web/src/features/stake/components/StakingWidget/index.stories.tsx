import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import StakingWidget from './index'

// StakingWidget embeds the Kiln staking app via AppFrame, which reads the
// connected Safe, chain config, address book and router. The mock harness
// supplies all of these (loaded efSafe scenario with a connected owner) so the
// widget mounts and renders the native embed frame in isolation.
const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/stake',
  shadcn: true,
})

const meta = {
  title: 'Features/Stake/StakingWidget',
  component: StakingWidget,
  loaders: [mswLoader],
  decorators: [setup.decorator],
  parameters: {
    layout: 'fullscreen',
    ...setup.parameters,
  },
} satisfies Meta<typeof StakingWidget>

export default meta

type Story = StoryObj<typeof meta>

// Default embed — opens the staking overview with no preselected asset.
export const Default: Story = {}

// Asset-specific embed — the optional `asset` prop is forwarded to the widget
// URL as a query param to deep-link a particular staking asset.
export const WithAsset: Story = {
  args: {
    asset: 'ETH',
  },
}
