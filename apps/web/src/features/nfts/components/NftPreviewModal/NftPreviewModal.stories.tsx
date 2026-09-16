import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import type { Collectible } from '@safe-global/store/gateway/AUTO_GENERATED/collectibles'
import { createMockStory } from '@/stories/mocks'
import NftPreviewModal from './index'

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  shadcn: true,
  pathname: '/balances/nfts',
})

const nft: Collectible = {
  address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
  tokenName: 'Bored Ape Yacht Club',
  tokenSymbol: 'BAYC',
  logoUri: '',
  id: '1234',
  uri: null,
  name: 'Bored Ape #1234',
  description: 'A bored ape',
  imageUri: 'https://safe-transaction-assets.staging.5afe.dev/chains/1/currency_logo.png',
  metadata: null,
}

const meta = {
  title: 'Features/Nfts/NftPreviewModal',
  component: NftPreviewModal,
  loaders: [mswLoader],
  decorators: [setup.decorator],
  parameters: {
    layout: 'fullscreen',
    ...setup.parameters,
  },
} satisfies Meta<typeof NftPreviewModal>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    nft,
    onClose: () => {},
  },
}
