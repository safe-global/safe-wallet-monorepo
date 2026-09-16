import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import type { Collectible } from '@safe-global/store/gateway/AUTO_GENERATED/collectibles'
import { createMockStory } from '@/stories/mocks'
import NftGrid from './index'

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  shadcn: true,
  pathname: '/balances/nfts',
})

const nfts: Collectible[] = [
  {
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
  },
  {
    address: '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB',
    tokenName: 'CryptoPunks',
    tokenSymbol: 'PUNK',
    logoUri: '',
    id: '5678',
    uri: null,
    name: 'CryptoPunk #5678',
    description: 'A crypto punk',
    imageUri: null,
    metadata: null,
  },
  {
    address: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
    tokenName: 'ENS: Ethereum Name Service',
    tokenSymbol: 'ENS',
    logoUri: '',
    id: '90125554478524554412254478555555444125',
    uri: null,
    name: 'safe-wallet.eth',
    description: 'An ENS name',
    imageUri: null,
    metadata: null,
  },
]

type StatefulNftGridProps = Omit<Parameters<typeof NftGrid>[0], 'selectedNfts' | 'setSelectedNfts' | 'onPreview'> & {
  initialSelection?: Collectible[]
}

const StatefulNftGrid = ({ initialSelection = [], ...props }: StatefulNftGridProps) => {
  const [selectedNfts, setSelectedNfts] = useState<Collectible[]>(initialSelection)

  return <NftGrid {...props} selectedNfts={selectedNfts} setSelectedNfts={setSelectedNfts} onPreview={() => {}} />
}

const meta = {
  title: 'Features/Nfts/NftGrid',
  component: StatefulNftGrid,
  loaders: [mswLoader],
  decorators: [setup.decorator],
  parameters: {
    layout: 'padded',
    ...setup.parameters,
  },
} satisfies Meta<typeof StatefulNftGrid>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    nfts,
    isLoading: false,
  },
}

export const WithSelection: Story = {
  args: {
    nfts,
    isLoading: false,
    initialSelection: [nfts[0], nfts[2]],
  },
}

export const Loading: Story = {
  args: {
    nfts: [],
    isLoading: true,
  },
}
