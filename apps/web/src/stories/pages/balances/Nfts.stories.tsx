import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import NFTs from '@/pages/balances/nfts'

/**
 * NFTs page - displays the user's NFT collections.
 * Shows NFT apps and collectibles organized by collection.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/balances/nfts',
})

const meta = {
  title: 'Pages/Core/Balances/NFTs',
  component: NFTs,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof NFTs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
