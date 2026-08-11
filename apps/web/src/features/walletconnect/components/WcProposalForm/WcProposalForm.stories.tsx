import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import type { WalletKitTypes } from '@reown/walletkit'
import { createMockStory } from '@/stories/mocks'
import WcProposalForm from './index'

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  shadcn: true,
})

const createProposal = ({
  name,
  url,
  icon,
  chains,
  validation,
  isScam = false,
}: {
  name: string
  url: string
  icon: string
  chains: string[]
  validation: 'UNKNOWN' | 'VALID' | 'INVALID'
  isScam?: boolean
}): WalletKitTypes.SessionProposal => ({
  id: 1710000000000000,
  params: {
    id: 1710000000000000,
    pairingTopic: 'mock-pairing-topic',
    expiryTimestamp: Math.floor(Date.now() / 1000) + 300,
    relays: [{ protocol: 'irn' }],
    proposer: {
      publicKey: 'mock-proposer-public-key',
      metadata: {
        name,
        description: `${name} dApp`,
        url,
        icons: [icon],
      },
    },
    requiredNamespaces: {
      eip155: {
        chains,
        methods: ['eth_sendTransaction', 'personal_sign', 'eth_signTypedData_v4'],
        events: ['chainChanged', 'accountsChanged'],
      },
    },
    optionalNamespaces: {},
  },
  verifyContext: {
    verified: {
      origin: url,
      validation,
      verifyUrl: 'https://verify.walletconnect.com',
      isScam,
    },
  },
})

const meta = {
  title: 'Features/WalletConnect/WcProposalForm',
  component: WcProposalForm,
  loaders: [mswLoader],
  decorators: [setup.decorator],
  parameters: {
    layout: 'padded',
    ...setup.parameters,
  },
  args: {
    onApprove: async () => {},
    onReject: async () => {},
  },
} satisfies Meta<typeof WcProposalForm>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    proposal: createProposal({
      name: 'Uniswap Interface',
      url: 'https://app.uniswap.org',
      icon: 'https://app.uniswap.org/favicon.png',
      chains: ['eip155:1'],
      validation: 'VALID',
    }),
  },
}

export const HighRisk: Story = {
  args: {
    proposal: createProposal({
      name: 'Suspicious dApp',
      url: 'https://suspicious-site.example',
      icon: '',
      chains: ['eip155:1'],
      validation: 'INVALID',
    }),
  },
}

export const Blocked: Story = {
  args: {
    proposal: createProposal({
      name: 'Known scam',
      url: 'https://scam-site.example',
      icon: '',
      chains: ['eip155:1'],
      validation: 'INVALID',
      isScam: true,
    }),
  },
}

export const UnsupportedChain: Story = {
  args: {
    proposal: createProposal({
      name: 'Testnet-only dApp',
      url: 'https://testnet-dapp.example',
      icon: '',
      chains: ['eip155:11155111'],
      validation: 'VALID',
    }),
  },
}
