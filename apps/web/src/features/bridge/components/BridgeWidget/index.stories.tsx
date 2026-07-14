import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import { BridgeWidget } from './index'

// BridgeWidget embeds the LI.FI bridge app via AppFrame. The page story
// (Pages/DeFi/Bridge) renders the route including the legal disclaimer gate;
// this story mounts the widget itself, past the disclaimer, so the embed
// surface can be inspected in isolation. The mainnet chain fixture has the
// BRIDGE feature enabled, which the widget requires to resolve its app data.
const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/bridge',
  shadcn: true,
})

const meta = {
  title: 'Features/Bridge/BridgeWidget',
  component: BridgeWidget,
  loaders: [mswLoader],
  decorators: [setup.decorator],
  parameters: {
    layout: 'fullscreen',
    ...setup.parameters,
  },
} satisfies Meta<typeof BridgeWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
